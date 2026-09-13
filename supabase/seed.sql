-- =====================================================================
-- DATA CONTOH untuk MODE TEST (WEBSHARE_TEST_MODE=true)
-- API key "mock-key-*" hanya dikenali oleh mode test (data palsu).
-- JANGAN jalankan file ini di database produksi.
-- =====================================================================

insert into public.webshare_accounts (id, label, email, api_key, status, catatan) values
  ('00000000-0000-4000-8000-000000000001', 'Akun Demo 1', 'demo1@example.com', 'mock-key-1', 'assigned',
   'Data contoh mode test: 150 proxy, bandwidth 84%'),
  ('00000000-0000-4000-8000-000000000002', 'Akun Demo 2', 'demo2@example.com', 'mock-key-2', 'assigned',
   'Data contoh mode test: 10 proxy, bandwidth 97%'),
  ('00000000-0000-4000-8000-000000000003', 'Akun Demo 3', 'demo3@example.com', 'mock-key-3', 'available',
   'Data contoh mode test: akun kosong untuk mencoba "Tambah pesanan"')
on conflict (id) do nothing;

insert into public.orders (id, shopee_order_no, account_id, nama_customer, expires_at, replace_quota, replace_used, catatan) values
  ('00000000-0000-4000-8000-000000000011', 'DEMOAKTIF001', '00000000-0000-4000-8000-000000000001',
   'Budi (contoh)', now() + interval '30 days', 10, 2, 'Pesanan contoh: aktif 30 hari'),
  ('00000000-0000-4000-8000-000000000012', 'DEMOEXPIRE002', '00000000-0000-4000-8000-000000000002',
   'Siti (contoh)', now() + interval '2 days', 3, 3, 'Pesanan contoh: expired 2 hari lagi, kuota replace habis')
on conflict (id) do nothing;
