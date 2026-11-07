-- =====================================================================
-- Cek Proxy DM Digital — invoice pembelian mandiri (bayar manual)
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
--
-- Konsep:
-- - Customer yang sudah punya akun memesan sendiri lewat /akun/beli.
-- - Nominal = harga paket + 3 digit acak, dijamin unik antar invoice yang
--   masih menunggu, supaya mudah dicocokkan dengan mutasi bank.
-- - Tidak ada auto-approve: admin yang menyetujui, lalu sistem membuat
--   pesanan yang LANGSUNG menempel ke akun customer (tanpa kode klaim).
--
-- Aman dijalankan ulang.
-- =====================================================================

create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_no       text not null unique,
  customer_id      uuid not null references public.customers(id) on delete restrict,
  jenis            text not null default 'baru',
  -- snapshot katalog: invoice lama tetap benar walau harga berubah
  paket_sku        text not null,
  paket_nama       text not null,
  kategori         text not null,
  ip               integer not null check (ip > 0),
  bandwidth_gb     integer not null check (bandwidth_gb > 0),
  masa_aktif_hari  integer not null default 30 check (masa_aktif_hari between 1 and 3650),
  harga_rp         integer not null check (harga_rp between 1000 and 100000000),
  kode_unik        integer not null check (kode_unik between 1 and 999),
  total_rp         integer generated always as (harga_rp + kode_unik) stored,
  metode           text not null,
  status           text not null default 'menunggu_bayar',
  -- pesanan yang diperpanjang (khusus jenis = 'perpanjangan')
  extend_order_id  uuid references public.orders(id) on delete restrict,
  -- pesanan hasil persetujuan
  order_id         uuid references public.orders(id) on delete set null,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  paid_claimed_at  timestamptz,
  approved_at      timestamptz,
  rejected_at      timestamptz,
  expired_at       timestamptz,
  canceled_at      timestamptz,
  catatan_customer text,
  catatan_admin    text,
  alasan_tolak     text
);

comment on column public.invoices.total_rp is
  'Harga paket + kode unik 3 digit. Inilah nominal yang harus ditransfer customer.';
comment on column public.invoices.catatan_admin is
  'Catatan internal; tidak pernah ditampilkan ke customer.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_no_check') then
    alter table public.invoices add constraint invoices_no_check
      check (invoice_no ~ '^INV-[0-9]{8}-[0-9A-F]{4}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_status_check') then
    alter table public.invoices add constraint invoices_status_check
      check (status in ('menunggu_bayar','menunggu_verifikasi','disetujui','ditolak','kedaluwarsa','dibatalkan'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_jenis_check') then
    alter table public.invoices add constraint invoices_jenis_check
      check (jenis in ('baru','perpanjangan'));
  end if;

  -- perpanjangan wajib menunjuk pesanan lama; pembelian baru tidak boleh
  if not exists (select 1 from pg_constraint where conname = 'invoices_perpanjangan_pair_check') then
    alter table public.invoices add constraint invoices_perpanjangan_pair_check
      check ((jenis = 'perpanjangan') = (extend_order_id is not null));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_metode_check') then
    alter table public.invoices add constraint invoices_metode_check
      check (metode in ('qris','bca','bri'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_tolak_check') then
    alter table public.invoices add constraint invoices_tolak_check
      check (status <> 'ditolak' or btrim(coalesce(alasan_tolak,'')) <> '');
  end if;
end;
$$;

-- Nominal unik: dua invoice yang MASIH MENUNGGU tidak boleh bernominal sama.
create unique index if not exists invoices_total_aktif_idx
  on public.invoices (total_rp)
  where status in ('menunggu_bayar','menunggu_verifikasi');

-- Satu pesanan hanya boleh punya satu invoice perpanjangan yang aktif.
create unique index if not exists invoices_perpanjangan_aktif_idx
  on public.invoices (extend_order_id)
  where extend_order_id is not null and status in ('menunggu_bayar','menunggu_verifikasi');

create index if not exists invoices_customer_idx on public.invoices (customer_id, created_at desc);
create index if not exists invoices_status_idx   on public.invoices (status, created_at desc);
create index if not exists invoices_due_idx      on public.invoices (expires_at) where status = 'menunggu_bayar';

alter table public.invoices enable row level security;
revoke all on public.invoices from anon, authenticated;

-- ---------------------------------------------------------------------
-- Perbaikan: create_order kehilangan wa_number (parameter belum ada)
-- ---------------------------------------------------------------------
drop function if exists public.create_order(text, uuid, text, timestamptz, integer, text);

create or replace function public.create_order(
  p_order_no text,
  p_account_id uuid,
  p_nama_customer text,
  p_expires_at timestamptz,
  p_replace_quota integer,
  p_catatan text,
  p_wa_number text default null
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

  insert into orders (shopee_order_no, account_id, nama_customer, expires_at, replace_quota, catatan, wa_number)
  values (p_order_no, p_account_id, p_nama_customer, p_expires_at, p_replace_quota, p_catatan, p_wa_number)
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_order(text, uuid, text, timestamptz, integer, text, text) from public, anon, authenticated;
grant execute on function public.create_order(text, uuid, text, timestamptz, integer, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Buat invoice (nomor & kode unik dibangkitkan di sini, dengan retry)
-- ---------------------------------------------------------------------
create or replace function public.create_invoice(
  p_customer_id uuid,
  p_jenis text,
  p_sku text,
  p_paket_nama text,
  p_kategori text,
  p_ip integer,
  p_bandwidth_gb integer,
  p_masa_aktif_hari integer,
  p_harga_rp integer,
  p_metode text,
  p_extend_order_id uuid,
  p_catatan text,
  p_ttl_jam integer,
  p_maks_aktif integer
)
returns public.invoices
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
  v_aktif integer;
  v_order orders;
begin
  select count(*) into v_aktif from invoices
   where customer_id = p_customer_id and status in ('menunggu_bayar','menunggu_verifikasi');
  if v_aktif >= p_maks_aktif then
    raise exception 'TOO_MANY_INVOICES';
  end if;

  if p_jenis = 'perpanjangan' then
    select * into v_order from orders where id = p_extend_order_id;
    if not found or v_order.customer_id is distinct from p_customer_id then
      raise exception 'ORDER_NOT_FOUND';
    end if;
  end if;

  for i in 1..15 loop
    begin
      insert into invoices (
        invoice_no, customer_id, jenis, paket_sku, paket_nama, kategori, ip, bandwidth_gb,
        masa_aktif_hari, harga_rp, kode_unik, metode, extend_order_id, expires_at, catatan_customer
      ) values (
        'INV-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-'
          || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4)),
        p_customer_id, p_jenis, p_sku, p_paket_nama, p_kategori, p_ip, p_bandwidth_gb,
        p_masa_aktif_hari, p_harga_rp, 1 + floor(random() * 999)::int, p_metode,
        p_extend_order_id, now() + make_interval(hours => p_ttl_jam), p_catatan
      )
      returning * into v_inv;
      return v_inv;
    exception when unique_violation then
      null; -- nomor atau nominal bentrok: coba lagi
    end;
  end loop;

  raise exception 'AMOUNT_COLLISION';
end;
$$;

-- ---------------------------------------------------------------------
-- Transisi status
-- ---------------------------------------------------------------------
create or replace function public.mark_invoice_paid(p_invoice_id uuid, p_customer_id uuid, p_catatan text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
begin
  update invoices
     set status = 'menunggu_verifikasi',
         paid_claimed_at = now(),
         catatan_customer = coalesce(nullif(btrim(p_catatan), ''), catatan_customer)
   where id = p_invoice_id and customer_id = p_customer_id and status = 'menunggu_bayar'
  returning * into v_inv;

  if found then
    return true;
  end if;

  select * into v_inv from invoices where id = p_invoice_id and customer_id = p_customer_id;
  if not found then
    raise exception 'INVOICE_NOT_FOUND';
  end if;
  if v_inv.status = 'menunggu_verifikasi' then
    return false;  -- klik kedua: tidak apa-apa, jangan kirim notifikasi lagi
  end if;
  raise exception 'INVOICE_STATUS_INVALID';
end;
$$;

create or replace function public.cancel_invoice(p_invoice_id uuid, p_customer_id uuid)
returns public.invoices
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
begin
  update invoices set status = 'dibatalkan', canceled_at = now()
   where id = p_invoice_id and customer_id = p_customer_id and status = 'menunggu_bayar'
  returning * into v_inv;
  if not found then
    raise exception 'INVOICE_STATUS_INVALID';
  end if;
  return v_inv;
end;
$$;

create or replace function public.reject_invoice(p_invoice_id uuid, p_alasan text)
returns public.invoices
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
begin
  update invoices set status = 'ditolak', rejected_at = now(), alasan_tolak = p_alasan
   where id = p_invoice_id
     and status in ('menunggu_bayar','menunggu_verifikasi','kedaluwarsa')
  returning * into v_inv;
  if not found then
    raise exception 'INVOICE_STATUS_INVALID';
  end if;
  return v_inv;
end;
$$;

create or replace function public.expire_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
begin
  update invoices set status = 'kedaluwarsa', expired_at = now()
   where id = p_invoice_id and status in ('menunggu_bayar','menunggu_verifikasi')
  returning * into v_inv;
  if not found then
    raise exception 'INVOICE_STATUS_INVALID';
  end if;
  return v_inv;
end;
$$;

-- Sapu bersih invoice yang lewat tempo; mengembalikan nomor yang kena.
create or replace function public.expire_invoices()
returns setof text
language plpgsql
set search_path = public
as $$
begin
  return query
    update invoices set status = 'kedaluwarsa', expired_at = now()
     where status = 'menunggu_bayar' and expires_at < now()
    returning invoice_no;
end;
$$;

-- ---------------------------------------------------------------------
-- Setujui invoice: klaim akun + buat pesanan + tandai lunas, satu transaksi
-- ---------------------------------------------------------------------
create or replace function public.approve_invoice(
  p_invoice_id uuid,
  p_account_id uuid,
  p_expires_at timestamptz,
  p_replace_quota integer,
  p_catatan text
)
returns public.orders
language plpgsql
set search_path = public
as $$
declare
  v_inv invoices;
  v_cust customers;
  v_order orders;
  v_no text;
  v_note text;
begin
  select * into v_inv from invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'INVOICE_NOT_FOUND';
  end if;
  if v_inv.status not in ('menunggu_bayar','menunggu_verifikasi','kedaluwarsa') then
    raise exception 'INVOICE_STATUS_INVALID';
  end if;

  select * into v_cust from customers where id = v_inv.customer_id;

  if v_inv.jenis = 'perpanjangan' then
    v_order := extend_order(v_inv.extend_order_id, v_inv.masa_aktif_hari, null);
  else
    v_note := '[' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD')
              || '] Dari invoice ' || v_inv.invoice_no || ' (' || v_inv.paket_nama || ')';

    for i in 1..15 loop
      begin
        v_no := 'DMP-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-'
                || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4));

        update webshare_accounts set status = 'assigned'
         where id = p_account_id and status = 'available';
        if not found then
          raise exception 'ACCOUNT_NOT_AVAILABLE';
        end if;

        -- customer_id & claimed_at diisi sekaligus → orders_claimed_pair_check lolos
        insert into orders (shopee_order_no, account_id, nama_customer, expires_at, replace_quota,
                            catatan, customer_id, claimed_at, wa_number)
        values (v_no, p_account_id, v_cust.nama, p_expires_at, p_replace_quota,
                v_note || coalesce(E'\n' || nullif(btrim(p_catatan), ''), ''),
                v_inv.customer_id, now(), v_cust.wa_number)
        returning * into v_order;
        exit;
      exception when unique_violation then
        null; -- nomor pesanan bentrok: klaim akun ikut dibatalkan, ulangi
      end;
    end loop;

    if v_order.id is null then
      raise exception 'DUPLICATE';
    end if;
  end if;

  update invoices
     set status = 'disetujui', approved_at = now(), order_id = v_order.id,
         catatan_admin = nullif(btrim(p_catatan), '')
   where id = v_inv.id;

  return v_order;
end;
$$;

revoke all on function public.create_invoice(uuid, text, text, text, text, integer, integer, integer, integer, text, uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.mark_invoice_paid(uuid, uuid, text)                                  from public, anon, authenticated;
revoke all on function public.cancel_invoice(uuid, uuid)                                            from public, anon, authenticated;
revoke all on function public.reject_invoice(uuid, text)                                            from public, anon, authenticated;
revoke all on function public.expire_invoice(uuid)                                                  from public, anon, authenticated;
revoke all on function public.expire_invoices()                                                     from public, anon, authenticated;
revoke all on function public.approve_invoice(uuid, uuid, timestamptz, integer, text)               from public, anon, authenticated;

grant execute on function public.create_invoice(uuid, text, text, text, text, integer, integer, integer, integer, text, uuid, text, integer, integer) to service_role;
grant execute on function public.mark_invoice_paid(uuid, uuid, text)                                to service_role;
grant execute on function public.cancel_invoice(uuid, uuid)                                          to service_role;
grant execute on function public.reject_invoice(uuid, text)                                          to service_role;
grant execute on function public.expire_invoice(uuid)                                                to service_role;
grant execute on function public.expire_invoices()                                                   to service_role;
grant execute on function public.approve_invoice(uuid, uuid, timestamptz, integer, text)             to service_role;
