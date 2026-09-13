# Cek Proxy DM Digital

Portal self-service untuk customer yang membeli proxy lewat Shopee. Customer cukup memasukkan **nomor pesanan Shopee** untuk:

- melihat masa aktif dan tombol perpanjang (Shopee / WhatsApp),
- mengecek sisa bandwidth,
- melihat, copy, dan download daftar proxy (3 format),
- mengganti IP (replace) sesuai kuota,
- mengelola IP whitelist.

Aplikasi ini **tidak menjual apa pun** dan tidak ada pembayaran. Admin mengelola pool akun Webshare dan pesanan di `/admin`.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 · Supabase Postgres · Deploy di Vercel.

---

## Daftar isi

1. [Coba cepat di komputer sendiri (tanpa Supabase)](#1-coba-cepat-di-komputer-sendiri-tanpa-supabase)
2. [Siapkan Supabase](#2-siapkan-supabase)
3. [Deploy ke Vercel](#3-deploy-ke-vercel)
4. [Beralih ke mode produksi (API Webshare asli)](#4-beralih-ke-mode-produksi-api-webshare-asli)
5. [Cara pakai panel admin](#5-cara-pakai-panel-admin)
6. [Environment variables](#6-environment-variables)
7. [Catatan teknis](#7-catatan-teknis)
8. [Masalah umum](#8-masalah-umum)

---

## 1. Coba cepat di komputer sendiri (tanpa Supabase)

Yang dibutuhkan: [Node.js](https://nodejs.org) versi 20 atau lebih baru.

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

Buka `.env.local`, lalu:

- **kosongkan** `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`,
- isi `ADMIN_PASSWORD` (bebas),
- biarkan `WEBSHARE_TEST_MODE=true`.

```bash
npm run dev
```

Buka http://localhost:3000.

Dengan `WEBSHARE_TEST_MODE=true` dan Supabase dikosongkan, aplikasi memakai **database sementara di memori** yang sudah berisi data contoh. Data akan hilang setiap kali server di-restart.

| Coba ini | Hasil |
| --- | --- |
| Nomor pesanan `DEMOAKTIF001` | Pesanan aktif 30 hari, 150 proxy (ada paginasi), bandwidth kuning 84% |
| Nomor pesanan `DEMOEXPIRE002` | Expired 2 hari lagi (banner kuning), bandwidth merah 97%, kuota replace habis |
| `http://localhost:3000/admin` | Login dengan `ADMIN_PASSWORD` |

### API key khusus mode test

Di mode test, API key tidak dikirim ke Webshare. Beberapa pola API key memicu perilaku tertentu:

| API key | Perilaku |
| --- | --- |
| `mock-key-1`, `mock-key-2`, `mock-key-3` | Akun contoh dari seed |
| mengandung `invalid` | Ditolak saat validasi |
| mengandung `nobw` | Data bandwidth gagal ("Data bandwidth sedang tidak tersedia") |
| mengandung `slowreplace` | Replace butuh 40 detik, sehingga statusnya "masih diproses" |
| mengandung `failreplace` | Replace selalu gagal (kuota dikembalikan) |
| key lain (min. 6 karakter) | Akun valid, 10 proxy, bandwidth unlimited |

---

## 2. Siapkan Supabase

1. Daftar/login di https://supabase.com, lalu klik **New project**. Pilih region **Southeast Asia (Singapore)** agar dekat dengan Indonesia. Simpan password database-nya.
2. Setelah project jadi, buka menu **SQL Editor**, lalu klik **New query**.
3. Buka file [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**. Pastikan hasilnya "Success".
4. *(Opsional, hanya untuk uji coba)* Jalankan juga [`supabase/seed.sql`](supabase/seed.sql) dengan cara yang sama. Data ini hanya bekerja jika `WEBSHARE_TEST_MODE=true`. **Jangan jalankan di database produksi.**
5. Buka **Project Settings → API** (atau **API Keys**), lalu salin dua nilai berikut:
   - **Project URL** untuk `SUPABASE_URL`
   - **service_role key** (atau **Secret key** `sb_secret_...`) untuk `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Service role key memberi akses penuh ke database. Jangan pernah membagikannya atau menaruhnya di kode. Aplikasi ini hanya memakainya di server.

Semua tabel memakai Row Level Security tanpa policy, jadi kunci publik (`anon`) tidak bisa membaca data apa pun.

---

## 3. Deploy ke Vercel

1. Upload proyek ini ke repository GitHub (bisa private).
2. Login ke https://vercel.com dengan akun GitHub, klik **Add New… → Project**, lalu pilih repository tersebut.
3. Framework akan terdeteksi otomatis sebagai **Next.js**. Tidak ada pengaturan build yang perlu diubah.
4. Buka bagian **Environment Variables** dan isi:

   | Nama | Nilai |
   | --- | --- |
   | `SUPABASE_URL` | Project URL dari Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key |
   | `ADMIN_PASSWORD` | password admin yang kuat |
   | `SESSION_SECRET` | string acak minimal 32 karakter (lihat di bawah) |
   | `WEBSHARE_TEST_MODE` | `true` untuk uji coba dulu, `false` untuk produksi |

   Cara membuat `SESSION_SECRET`:
   - di terminal: `openssl rand -hex 32`
   - atau di Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

5. Klik **Deploy**. Setelah selesai, buka `https://nama-proyek.vercel.app`.
6. *(Opsional)* Hubungkan domain sendiri di **Settings → Domains**.

Setiap perubahan environment variable baru berlaku setelah **Redeploy** (menu Deployments, lalu ⋯ → Redeploy).

---

## 4. Beralih ke mode produksi (API Webshare asli)

1. Jika sebelumnya menjalankan `seed.sql`, hapus data contoh lewat SQL Editor:
   ```sql
   delete from orders where shopee_order_no in ('DEMOAKTIF001', 'DEMOEXPIRE002');
   delete from webshare_accounts where api_key like 'mock-key-%';
   ```
2. Di Vercel, ubah `WEBSHARE_TEST_MODE` menjadi `false`, lalu Redeploy.
3. Masukkan akun Webshare asli di **/admin → Pool Akun**. API key ada di dashboard Webshare, menu **API Keys**.

---

## 5. Cara pakai panel admin

Buka `/admin` dan login dengan `ADMIN_PASSWORD`.

**Alur harian:**

1. **Pool Akun → Tambah akun**: isi label dan API key. Saat disimpan, key divalidasi ke Webshare dan email serta plan-nya ditampilkan. Untuk banyak akun sekaligus, gunakan **Bulk import** (satu API key per baris, maksimal 30 per import).
2. **Pesanan → Tambah pesanan**: isi nomor pesanan Shopee, pilih akun yang *available*, tanggal expired (ada tombol +7 / +30 hari), dan kuota replace.
3. Kirim link `https://domain-anda/pesanan/NOMORPESANAN` ke customer lewat chat Shopee, atau minta customer membuka halaman utama dan memasukkan nomor pesanannya.

**Kelola pesanan** (klik nomor pesanan atau tombol *Kelola*):

- **Edit**: nomor pesanan, nama, tanggal expired, kuota replace, dan replace terpakai, plus tombol reset ke 0.
- **Perpanjang**: tambah X hari. Jika pesanan sudah expired, perpanjangan dihitung dari hari ini. Anda bisa sekaligus mengganti ke nomor pesanan Shopee yang baru; nomor lama otomatis dicatat di kolom catatan. Setelah ganti nomor, link lama tidak berlaku lagi, jadi kirim link baru ke customer.
- **Lepas akun**: akun kembali *available*. Sebelum dipakai customer lain, disarankan menghapus IP whitelist dan mengganti password proxy di dashboard Webshare.
- **Nonaktifkan**: customer tidak bisa membuka halaman pesanan.
- **Log replace**: semua percobaan replace beserta error teknisnya (hanya terlihat oleh admin).

**Dashboard** menampilkan jumlah akun available, pesanan aktif, dan daftar pesanan yang akan expired dalam 3 hari untuk di-follow-up di Shopee.

---

## 6. Environment variables

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `SUPABASE_URL` | Ya (produksi) | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya (produksi) | Service role / secret key. **Hanya server.** |
| `ADMIN_PASSWORD` | Ya | Password login `/admin`. Mengganti password otomatis mengeluarkan semua sesi admin. |
| `SESSION_SECRET` | Ya (produksi) | Kunci tanda tangan cookie sesi, minimal 32 karakter |
| `WEBSHARE_TEST_MODE` | Tidak | `true` = data proxy palsu. Jika `true` dan Supabase kosong, memakai DB memori. |

`DATABASE_URL` tidak diperlukan karena aplikasi terhubung ke Supabase lewat `SUPABASE_URL` + service role key.

---

## 7. Catatan teknis

### Keamanan

- Semua panggilan ke Webshare terjadi di server (Route Handlers / Server Actions). Modul yang memegang API key ditandai `server-only`, sehingga build akan gagal jika modul itu tidak sengaja di-import dari komponen browser.
- API key tidak pernah dikirim ke browser, termasuk di panel admin (hanya ditampilkan tersamar, misalnya `abcd…wxyz`).
- Pesan error untuk customer selalu bersih: tanpa kata "Webshare", tanpa URL API, dan tanpa pesan mentah dari upstream. Detail teknis hanya ada di log server dan log replace admin.
- Sesi admin berupa cookie `httpOnly` yang ditandatangani HMAC-SHA256.
- **Rate limit per IP** disimpan di tabel `rate_limits`, sehingga berlaku di semua instance Vercel:
  | Aksi | Batas |
  | --- | --- |
  | Pencarian nomor pesanan + setiap nomor yang tidak ditemukan | 10 / menit |
  | Replace IP | 5 / menit |
  | Tambah/hapus IP whitelist | 10 / menit |
  | Semua API customer | 90 / menit |
  | Login admin | 5 / 5 menit |
- Tidak ada daftar atau auto-suggest nomor pesanan di sisi customer. Halaman `/pesanan/*` dan `/admin` diberi `noindex`.

### Integrasi Webshare ([`lib/webshare.ts`](lib/webshare.ts))

Semua endpoint diakhiri `/` dan memakai header `Authorization: Token <API_KEY>`.

| Fitur | Endpoint |
| --- | --- |
| Validasi key / plan | `GET /api/v2/subscription/plan/` (object tunggal atau `{results}`; diambil yang `status == "active"`) |
| Email akun | `GET /api/v2/profile/` |
| Daftar proxy | `GET /api/v2/proxy/list/?mode=direct&page=1&page_size=100`, mengikuti `next` |
| Replace IP | `POST /api/v3/proxy/replace/` lalu poll `GET /api/v3/proxy/replace/{id}/` tiap 2 detik (maks. ±25 detik) |
| Negara replace | `GET /api/v2/proxy/config/` → `available_countries` (tanpa `ZZ` & nilai 0, cache 1 jam). Jika tidak tersedia, fallback ke `GET /api/v3/proxy/list/stats/` sesuai dokumentasi terbaru. |
| IP whitelist | `GET`/`POST /api/v2/proxy/ipauthorization/`, `DELETE /api/v2/proxy/ipauthorization/{id}/` |
| Bandwidth | lihat di bawah |

**Bandwidth** (sudah diverifikasi terhadap https://apidocs.webshare.io):

- *Limit*: `bandwidth_limit` dari plan aktif, dalam GB. Nilai `0` berarti Unlimited.
- *Periode*: `start_date` – `end_date` dari `GET /api/v2/subscription/`. Field periode tidak ada di objek plan.
- *Pemakaian*: `GET /api/v2/stats/aggregate/?timestamp__gte=…&timestamp__lte=…`, field `bandwidth_total` dalam **bytes**.
  - Batasan docs: `timestamp__gte` maksimal 90 hari ke belakang, dan `timestamp__lte` tidak boleh melewati `end_date`. Keduanya di-clamp otomatis.
- Bytes dikonversi ke GB desimal (1 GB = 10⁹ bytes). Jika angkanya berbeda dengan dashboard Webshare, ubah konstanta `BYTES_PER_GB` di `lib/webshare.ts`.
- Jika gagal, customer melihat "Data bandwidth sedang tidak tersedia". Tidak ada fallback diam-diam ke 0. Hasil di-cache 5 menit per akun.

**Alur replace IP** ([`lib/services/replace.ts`](lib/services/replace.ts)):

1. Pastikan IP ada di daftar proxy pesanan dan negara tujuan tersedia.
2. `replace_used` dinaikkan **secara atomik** sekaligus memasang kunci proses per pesanan (fungsi SQL `try_start_replace`). Ini mencegah double click dan race condition.
3. Buat replacement v3, lalu poll hingga `completed` / `failed` / error.
4. Hasil:
   - **Berhasil**: log `success`, cache daftar proxy dihapus, dan browser memuat ulang daftar.
   - **Gagal**: kuota di-rollback dan log `failed` (dengan error mentah untuk admin).
   - **Belum selesai dalam 25 detik**: log `pending` dan kuota tetap terpakai sementara. Saat halaman customer dibuka lagi, status dicek ulang (rekonsiliasi). Jika ternyata gagal, kuota dikembalikan.
5. Route replace memakai `maxDuration = 60` detik.

### Aturan masa aktif

- **Sisa hari ≤ 3**: banner kuning dengan tombol perpanjang.
- **Sudah expired**: banner merah. Replace dan whitelist dinonaktifkan, daftar proxy diburamkan dan password disamarkan dari server.
- **Expired lebih dari 7 hari**: halaman tidak bisa dibuka, dengan pesan ramah dan ajakan order lagi.

### Struktur folder

```
app/
  page.tsx                     halaman utama (cari nomor pesanan)
  pesanan/[no]/page.tsx        detail pesanan customer
  api/pesanan/[no]/…           API customer (bandwidth, proxies, countries, replace, whitelist)
  api/my-ip/                   deteksi IP pengunjung dari header request
  admin/login/                 login admin
  admin/(panel)/…              dashboard, pool akun, pesanan
  admin/actions.ts             server actions admin (validasi zod)
components/                    UI (customer/, admin/, ui.tsx, icons.tsx)
lib/
  webshare.ts                  klien API Webshare (+ webshare-mock.ts untuk mode test)
  db/                          repository Supabase & memori
  services/                    logika pesanan, cache data proxy, replace
  rate-limit.ts, session.ts, cache.ts, …
supabase/
  migrations/0001_init.sql     skema + fungsi atomik
  seed.sql                     data contoh mode test
```

---

## 8. Masalah umum

| Gejala | Solusi |
| --- | --- |
| `Database belum dikonfigurasi` | Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, lalu Redeploy. |
| Error `relation "orders" does not exist` | Migrasi SQL belum dijalankan (lihat langkah 2). |
| Tidak bisa login admin | Cek `ADMIN_PASSWORD` di Vercel, lalu Redeploy. Setelah 5 kali salah, tunggu 5 menit. |
| Error `SESSION_SECRET` | Isi dengan minimal 32 karakter acak. |
| "API key ditolak" saat tambah akun | Pastikan `WEBSHARE_TEST_MODE=false` dan API key benar serta punya plan aktif. |
| Bandwidth "tidak tersedia" | Lihat log di Vercel (Deployments → Functions/Logs). Akun mungkin tanpa langganan aktif. Pesan teknisnya terlihat di kolom bandwidth panel admin (arahkan kursor). |
| Customer IPv6 tidak bisa "Gunakan IP saya" | Whitelist hanya menerima IPv4. Customer perlu mengisi IPv4 secara manual. |
