-- =====================================================================
-- Cek Proxy DM Digital — lokasi (negara) yang diminta customer
-- Jalankan di Supabase: Dashboard → SQL Editor → New query → paste → Run
--
-- Sebelumnya customer hanya bisa menulis permintaan negara di kolom
-- catatan bebas, dan sering tidak menulis apa-apa — jadi admin harus
-- menebak atau bertanya lewat chat sebelum bisa menyiapkan pesanan.
-- Sekarang lokasi wajib dipilih di checkout dan disimpan terpisah.
--
-- Bentuk isinya:
--   'RANDOM'     → biar admin yang memilih negara terbaik
--   'US:2,KR:3'  → paket statis; jumlahnya pas dengan jumlah IP paket
--   'US,KR'      → paket rotating; cukup daftar negara yang disukai
--
-- Dibiarkan NULL untuk invoice lama yang dibuat sebelum fitur ini ada,
-- supaya tidak ada data lama yang dikarang isinya.
--
-- Aman dijalankan ulang.
-- =====================================================================

alter table public.invoices
  add column if not exists lokasi text;

comment on column public.invoices.lokasi is
  'Negara yang diminta customer. RANDOM = admin yang pilih. US:2,KR:3 = rincian per negara. NULL = invoice lama sebelum fitur ini ada.';

-- create_invoice: satu parameter baru di urutan paling akhir, dengan
-- default null supaya pemanggilan lama tetap valid.
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
  p_maks_aktif integer,
  p_produk text default 'statis',
  p_rate_per_minute integer default null,
  p_lokasi text default null
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
        invoice_no, customer_id, jenis, produk, paket_sku, paket_nama, kategori, ip, bandwidth_gb,
        masa_aktif_hari, harga_rp, kode_unik, metode, rate_per_minute, lokasi,
        extend_order_id, expires_at, catatan_customer
      ) values (
        'INV-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-'
          || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)),
        p_customer_id, p_jenis, p_produk, p_sku, p_paket_nama, p_kategori, p_ip, p_bandwidth_gb,
        p_masa_aktif_hari, p_harga_rp, 1 + floor(random() * 999)::int, p_metode, p_rate_per_minute, p_lokasi,
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

-- Lokasi yang diminta ikut tercatat di catatan pesanan, supaya admin
-- melihatnya di halaman pesanan tanpa harus membuka invoice-nya lagi.
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

  v_note := '[' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD')
            || '] Dari invoice ' || v_inv.invoice_no || ' (' || v_inv.paket_nama || ')'
            || coalesce(E'\nLokasi diminta: ' || nullif(btrim(v_inv.lokasi), ''), '');

  if v_inv.jenis = 'perpanjangan' then
    v_order := extend_order(v_inv.extend_order_id, v_inv.masa_aktif_hari, null);

  elsif v_inv.produk = 'rotating' then
    for i in 1..15 loop
      begin
        v_no := 'DMP-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

        insert into orders (shopee_order_no, account_id, nama_customer, expires_at, replace_quota,
                            catatan, customer_id, claimed_at, wa_number,
                            order_type, api_key, rate_per_minute)
        values (v_no, null, v_cust.nama, p_expires_at, 0,
                v_note || coalesce(E'\n' || nullif(btrim(p_catatan), ''), ''),
                v_inv.customer_id, now(), v_cust.wa_number,
                'rotating', 'dmr_' || replace(gen_random_uuid()::text, '-', ''), v_inv.rate_per_minute)
        returning * into v_order;
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;

    if v_order.id is null then
      raise exception 'DUPLICATE';
    end if;

  else
    for i in 1..15 loop
      begin
        v_no := 'DMP-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

        update webshare_accounts set status = 'assigned'
         where id = p_account_id and status = 'available';
        if not found then
          raise exception 'ACCOUNT_NOT_AVAILABLE';
        end if;

        insert into orders (shopee_order_no, account_id, nama_customer, expires_at, replace_quota,
                            catatan, customer_id, claimed_at, wa_number)
        values (v_no, p_account_id, v_cust.nama, p_expires_at, p_replace_quota,
                v_note || coalesce(E'\n' || nullif(btrim(p_catatan), ''), ''),
                v_inv.customer_id, now(), v_cust.wa_number)
        returning * into v_order;
        exit;
      exception when unique_violation then
        null;
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

revoke all on function public.create_invoice(
  uuid, text, text, text, text, integer, integer, integer, integer, text, uuid, text, integer, integer, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.create_invoice(
  uuid, text, text, text, text, integer, integer, integer, integer, text, uuid, text, integer, integer, text, integer, text)
  to service_role;

revoke all on function public.approve_invoice(uuid, uuid, timestamptz, integer, text) from public, anon, authenticated;
grant execute on function public.approve_invoice(uuid, uuid, timestamptz, integer, text) to service_role;

-- Versi 16 parameter dari migrasi 0007 tidak lagi dipakai aplikasi, dan
-- harus dibuang supaya PostgREST tidak bingung memilih di antara dua
-- kandidat saat p_lokasi tidak dikirim.
drop function if exists public.create_invoice(
  uuid, text, text, text, text, integer, integer, integer, integer, text, uuid, text, integer, integer, text, integer);

notify pgrst, 'reload schema';
