-- =====================================================================
-- Cek Proxy DM Digital — akun customer, kode klaim, notifikasi WhatsApp
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
--
-- Konsep:
-- - Customer mendaftar sendiri memakai nomor WhatsApp + password.
-- - Admin membuat kode klaim per pesanan; customer memasukkan kode itu
--   untuk menautkan pesanan ke akunnya. Kode sekali pakai (dihapus saat
--   klaim berhasil) dan punya masa berlaku.
-- - orders.wa_number menyimpan nomor pembeli walau belum punya akun,
--   supaya kode klaim dan pengingat expired tetap bisa dikirim.
-- - wa_messages mencatat setiap pesan yang dikirim agar tidak dobel.
--
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Akun customer
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  -- kanonik: digit saja, selalu diawali 62 (dinormalisasi aplikasi)
  wa_number       text not null unique check (wa_number ~ '^628[0-9]{8,11}$'),
  nama            text not null check (length(btrim(nama)) between 1 and 100),
  -- format: scrypt$N$r$p$<salt base64url>$<hash base64url>
  password_hash   text not null,
  -- dinaikkan saat ganti password / blokir → semua cookie sesi lama batal
  session_version integer not null default 1,
  is_blocked      boolean not null default false,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

create index if not exists customers_created_idx on public.customers (created_at desc);

-- ---------------------------------------------------------------------
-- Kaitan pesanan ↔ akun customer
-- ---------------------------------------------------------------------
alter table public.orders
  -- restrict: customer yang masih punya pesanan tidak bisa dihapus sebelum
  -- pesanannya dilepas dari akun (lihat constraint orders_claimed_pair_check).
  add column if not exists customer_id           uuid references public.customers(id) on delete restrict,
  add column if not exists claimed_at            timestamptz,
  add column if not exists claim_code            text,
  add column if not exists claim_code_expires_at timestamptz,
  add column if not exists wa_number             text;

comment on column public.orders.wa_number is
  'Nomor WhatsApp pembeli (format 62…). Dipakai mengirim kode klaim & pengingat expired sebelum customer punya akun.';
comment on column public.orders.claim_code is
  'Kode klaim sekali pakai. Di-null-kan begitu pesanan berhasil diklaim.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_claim_code_check') then
    alter table public.orders
      add constraint orders_claim_code_check
      check (claim_code is null or claim_code ~ '^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_claimed_pair_check') then
    -- claimed_at hanya boleh terisi bersama customer_id
    alter table public.orders
      add constraint orders_claimed_pair_check
      check ((customer_id is null) = (claimed_at is null));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_wa_number_check') then
    alter table public.orders
      add constraint orders_wa_number_check
      check (wa_number is null or wa_number ~ '^628[0-9]{8,11}$');
  end if;
end;
$$;

create unique index if not exists orders_claim_code_idx
  on public.orders (claim_code) where claim_code is not null;
create index if not exists orders_customer_idx
  on public.orders (customer_id) where customer_id is not null;

-- ---------------------------------------------------------------------
-- Log pesan WhatsApp (anti kirim dobel)
-- ---------------------------------------------------------------------
create table if not exists public.wa_messages (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  to_number    text not null,
  template     text not null check (template in ('claim_code', 'expiry_h3', 'expiry_h1', 'expired', 'manual')),
  status       text not null check (status in ('sent', 'failed')),
  error        text,
  provider_id  text,
  created_at   timestamptz not null default now()
);

-- Satu pesanan hanya boleh menerima satu pesan sukses per jenis pengingat.
create unique index if not exists wa_messages_once_idx
  on public.wa_messages (order_id, template)
  where status = 'sent' and order_id is not null and template <> 'manual';
create index if not exists wa_messages_created_idx on public.wa_messages (created_at desc);

-- ---------------------------------------------------------------------
-- Keamanan: hanya service role (server) yang boleh mengakses.
-- ---------------------------------------------------------------------
alter table public.customers   enable row level security;
alter table public.wa_messages enable row level security;

revoke all on public.customers, public.wa_messages from anon, authenticated;

-- ---------------------------------------------------------------------
-- Klaim pesanan secara atomik
-- ---------------------------------------------------------------------
create or replace function public.claim_order(p_code text, p_customer_id uuid)
returns public.orders
language plpgsql
set search_path = public
as $$
declare
  v_order orders;
  v_note  text;
begin
  select * into v_order from orders where claim_code = p_code for update;
  if not found then
    raise exception 'CLAIM_CODE_INVALID';
  end if;

  if v_order.customer_id is not null then
    raise exception 'ALREADY_CLAIMED';
  end if;

  if v_order.claim_code_expires_at is not null and v_order.claim_code_expires_at < now() then
    raise exception 'CLAIM_CODE_EXPIRED';
  end if;

  v_note := '[' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD')
            || '] Diklaim oleh akun customer';

  update orders
     set customer_id = p_customer_id,
         claimed_at = now(),
         claim_code = null,
         claim_code_expires_at = null,
         catatan = case
                     when coalesce(catatan, '') = '' then v_note
                     else catatan || E'\n' || v_note
                   end
   where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.claim_order(text, uuid) from public, anon, authenticated;
grant execute on function public.claim_order(text, uuid) to service_role;
