-- =====================================================================
-- Cek Proxy DM Digital — skema database awal
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Pool akun Webshare (1 akun = 1 API key)
-- ---------------------------------------------------------------------
create table if not exists public.webshare_accounts (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  email       text,
  api_key     text not null unique,
  status      text not null default 'available'
              check (status in ('available', 'assigned', 'disabled')),
  catatan     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Pesanan Shopee (1 pesanan = 1 akun)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  -- disimpan UPPERCASE tanpa spasi (dinormalisasi aplikasi, dijaga constraint)
  shopee_order_no     text not null unique
                      check (shopee_order_no ~ '^[A-Z0-9-]{4,40}$'),
  account_id          uuid unique references public.webshare_accounts(id) on delete restrict,
  nama_customer       text,
  expires_at          timestamptz not null,
  replace_quota       integer not null default 10 check (replace_quota >= 0),
  replace_used        integer not null default 0 check (replace_used >= 0),
  -- kunci singkat agar tidak ada 2 proses replace bersamaan (anti double click)
  replace_lock_until  timestamptz,
  is_active           boolean not null default true,
  catatan             text,
  created_at          timestamptz not null default now()
);

create index if not exists orders_expires_at_idx on public.orders (expires_at);

-- ---------------------------------------------------------------------
-- Log replace IP
-- status 'pending' = proses di server proxy belum selesai saat batas waktu
-- polling habis; akan direkonsiliasi otomatis saat halaman customer dibuka.
-- ---------------------------------------------------------------------
create table if not exists public.replace_logs (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  old_ip          text not null,
  new_country     text not null,           -- 'ANY' atau kode negara (US, SG, ...)
  status          text not null check (status in ('pending', 'success', 'failed')),
  error           text,
  replacement_id  bigint,                  -- id replacement dari API upstream
  created_at      timestamptz not null default now()
);

create index if not exists replace_logs_order_idx on public.replace_logs (order_id, created_at desc);
create index if not exists replace_logs_pending_idx on public.replace_logs (order_id) where status = 'pending';

-- ---------------------------------------------------------------------
-- Rate limit per IP & cache hasil API (dipakai bersama semua instance Vercel)
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key         text primary key,
  count       integer not null,
  expires_at  timestamptz not null
);

create table if not exists public.cache_entries (
  key         text primary key,
  value       jsonb not null,
  expires_at  timestamptz not null
);

-- ---------------------------------------------------------------------
-- Keamanan: tabel hanya boleh diakses lewat service role (server).
-- RLS aktif tanpa policy = anon/authenticated tidak bisa membaca apa pun.
-- ---------------------------------------------------------------------
alter table public.webshare_accounts enable row level security;
alter table public.orders            enable row level security;
alter table public.replace_logs      enable row level security;
alter table public.rate_limits       enable row level security;
alter table public.cache_entries     enable row level security;

revoke all on public.webshare_accounts, public.orders, public.replace_logs,
              public.rate_limits, public.cache_entries
  from anon, authenticated;

-- =====================================================================
-- Fungsi atomik (dipanggil via RPC dari server)
-- =====================================================================

-- Tambah hitungan rate limit; mengembalikan jumlah hit di window saat ini.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limits (key, count, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case when rate_limits.expires_at < now() then 1 else rate_limits.count + 1 end,
        expires_at = case when rate_limits.expires_at < now()
                          then now() + make_interval(secs => p_window_seconds)
                          else rate_limits.expires_at end
  returning count into v_count;

  -- bersih-bersih sesekali
  if random() < 0.02 then
    delete from rate_limits where expires_at < now() - interval '1 hour';
    delete from cache_entries where expires_at < now() - interval '1 hour';
  end if;

  return v_count;
end;
$$;

-- Buat pesanan + tandai akun 'assigned' dalam satu transaksi.
create or replace function public.create_order(
  p_order_no text,
  p_account_id uuid,
  p_nama_customer text,
  p_expires_at timestamptz,
  p_replace_quota integer,
  p_catatan text
)
returns public.orders
language plpgsql
set search_path = public
as $$
declare
  v_order orders;
begin
  update webshare_accounts set status = 'assigned'
   where id = p_account_id and status = 'available';
  if not found then
    raise exception 'ACCOUNT_NOT_AVAILABLE';
  end if;

  insert into orders (shopee_order_no, account_id, nama_customer, expires_at, replace_quota, catatan)
  values (p_order_no, p_account_id, p_nama_customer, p_expires_at, p_replace_quota, p_catatan)
  returning * into v_order;

  return v_order;
end;
$$;

-- Tautkan / lepas akun dari pesanan (p_account_id null = lepas).
create or replace function public.set_order_account(p_order_id uuid, p_account_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_old uuid;
begin
  select account_id into v_old from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_old is not distinct from p_account_id then
    return;
  end if;

  if p_account_id is not null then
    update webshare_accounts set status = 'assigned'
     where id = p_account_id and status = 'available';
    if not found then
      raise exception 'ACCOUNT_NOT_AVAILABLE';
    end if;
  end if;

  update orders set account_id = p_account_id where id = p_order_id;

  if v_old is not null then
    update webshare_accounts set status = 'available'
     where id = v_old and status = 'assigned';
  end if;
end;
$$;

-- Perpanjang pesanan. Jika sudah expired, dihitung dari sekarang.
-- Opsional ganti nomor pesanan (nomor lama dicatat di kolom catatan).
create or replace function public.extend_order(p_order_id uuid, p_days integer, p_new_order_no text)
returns public.orders
language plpgsql
set search_path = public
as $$
declare
  v orders;
  v_note text;
begin
  select * into v from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  v_note := '[' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD') || '] Diperpanjang '
            || p_days || ' hari';
  if coalesce(p_new_order_no, '') <> '' and p_new_order_no <> v.shopee_order_no then
    v_note := v_note || '. Nomor pesanan lama: ' || v.shopee_order_no;
  end if;

  update orders
     set expires_at = greatest(expires_at, now()) + make_interval(days => p_days),
         shopee_order_no = coalesce(nullif(p_new_order_no, ''), shopee_order_no),
         catatan = case when coalesce(catatan, '') = '' then v_note else catatan || E'\n' || v_note end
   where id = p_order_id
  returning * into v;

  return v;
end;
$$;

-- Naikkan replace_used secara atomik + pasang kunci proses.
-- Mengembalikan replace_used baru, atau NULL jika kuota habis / sedang diproses /
-- pesanan tidak aktif / expired.
create or replace function public.try_start_replace(p_order_id uuid, p_lock_seconds integer)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_used integer;
begin
  update orders
     set replace_used = replace_used + 1,
         replace_lock_until = now() + make_interval(secs => p_lock_seconds)
   where id = p_order_id
     and is_active
     and account_id is not null
     and expires_at > now()
     and replace_used < replace_quota
     and (replace_lock_until is null or replace_lock_until < now())
  returning replace_used into v_used;

  return v_used;
end;
$$;

-- Lepas kunci proses replace; p_rollback = true mengembalikan kuota.
create or replace function public.release_replace_lock(p_order_id uuid, p_rollback boolean)
returns void
language plpgsql
set search_path = public
as $$
begin
  update orders
     set replace_lock_until = null,
         replace_used = case when p_rollback then greatest(replace_used - 1, 0) else replace_used end
   where id = p_order_id;
end;
$$;

-- Kembalikan 1 kuota (dipakai saat replace 'pending' ternyata gagal).
create or replace function public.decrement_replace_used(p_order_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update orders set replace_used = greatest(replace_used - 1, 0) where id = p_order_id;
end;
$$;

-- Fungsi hanya boleh dieksekusi service role.
revoke all on function public.rate_limit_hit(text, integer)                                   from public, anon, authenticated;
revoke all on function public.create_order(text, uuid, text, timestamptz, integer, text)       from public, anon, authenticated;
revoke all on function public.set_order_account(uuid, uuid)                                    from public, anon, authenticated;
revoke all on function public.extend_order(uuid, integer, text)                                from public, anon, authenticated;
revoke all on function public.try_start_replace(uuid, integer)                                 from public, anon, authenticated;
revoke all on function public.release_replace_lock(uuid, boolean)                              from public, anon, authenticated;
revoke all on function public.decrement_replace_used(uuid)                                     from public, anon, authenticated;

grant execute on function public.rate_limit_hit(text, integer)                                 to service_role;
grant execute on function public.create_order(text, uuid, text, timestamptz, integer, text)    to service_role;
grant execute on function public.set_order_account(uuid, uuid)                                 to service_role;
grant execute on function public.extend_order(uuid, integer, text)                             to service_role;
grant execute on function public.try_start_replace(uuid, integer)                              to service_role;
grant execute on function public.release_replace_lock(uuid, boolean)                           to service_role;
grant execute on function public.decrement_replace_used(uuid)                                  to service_role;
