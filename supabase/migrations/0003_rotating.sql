-- =====================================================================
-- Cek Proxy DM Digital — produk rotating (API rotasi)
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
--
-- Konsep:
-- - Akun yang ditandai rotating_enabled ikut menyumbang proxy ke pool.
-- - rotating_reserve_gb = bandwidth yang DISISAKAN untuk customer statis.
--   Begitu pemakaian akun melewati (limit - cadangan), akun berhenti dipakai
--   untuk rotating.
-- - Pesanan rotating tidak menempel ke satu akun; aksesnya memakai api_key.
-- =====================================================================

alter table public.webshare_accounts
  add column if not exists rotating_enabled    boolean not null default false,
  add column if not exists rotating_reserve_gb numeric;

comment on column public.webshare_accounts.rotating_reserve_gb is
  'GB yang disisakan untuk customer statis. NULL = tanpa cadangan (pakai sampai limit akun).';

alter table public.orders
  add column if not exists order_type      text not null default 'static',
  add column if not exists api_key         text,
  add column if not exists rate_per_minute integer not null default 60;

-- Constraint ditambahkan terpisah supaya aman dijalankan ulang.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_order_type_check') then
    alter table public.orders
      add constraint orders_order_type_check check (order_type in ('static', 'rotating'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_rate_per_minute_check') then
    alter table public.orders
      add constraint orders_rate_per_minute_check check (rate_per_minute between 1 and 100000);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_rotating_api_key_check') then
    -- Pesanan rotating wajib punya api_key; pesanan statis tidak memakainya.
    alter table public.orders
      add constraint orders_rotating_api_key_check
      check (order_type <> 'rotating' or api_key is not null);
  end if;
end;
$$;

create unique index if not exists orders_api_key_idx on public.orders (api_key) where api_key is not null;
