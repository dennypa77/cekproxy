-- =====================================================================
-- Cek Proxy DM Digital — info plan (jenis proxy) per akun
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
--
-- Diisi otomatis saat akun ditambahkan / API key divalidasi ulang,
-- atau lewat tombol "Sinkronkan info plan" di panel admin.
-- =====================================================================

alter table public.webshare_accounts
  add column if not exists proxy_type        text,        -- free / shared / semidedicated / dedicated
  add column if not exists proxy_subtype     text,        -- default / premium / isp / residential / datacenter_and_isp
  add column if not exists proxy_count       integer,
  add column if not exists bandwidth_limit_gb numeric,    -- 0 = unlimited
  add column if not exists plan_synced_at    timestamptz;

comment on column public.webshare_accounts.proxy_subtype is
  'Penentu jenis proxy: residential / isp / datacenter (default & premium) / datacenter_and_isp';
