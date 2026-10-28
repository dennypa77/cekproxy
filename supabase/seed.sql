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

-- Akun customer contoh. Password: demo1234 (hash scrypt, hanya untuk mode test).
insert into public.customers (id, wa_number, nama, password_hash) values
  ('00000000-0000-4000-8000-000000000021', '628123456789', 'Rudi (contoh)',
   'scrypt$16384$8$1$xQ5qWKI1nPp2n7ZLtswbYg$6yiySy8-0f8z_Z1y79Sx6E0dr6X3heA5Y8ccd65Z6Wk')
on conflict (id) do nothing;

-- Satu pesanan contoh sudah diklaim, satu lagi menunggu kode klaim.
update public.orders
   set customer_id = '00000000-0000-4000-8000-000000000021', claimed_at = now(), wa_number = '628123456789'
 where id = '00000000-0000-4000-8000-000000000011' and customer_id is null;

update public.orders
   set claim_code = 'K7M2P-9XQ4T', claim_code_expires_at = now() + interval '7 days'
 where id = '00000000-0000-4000-8000-000000000012' and claim_code is null and customer_id is null;
