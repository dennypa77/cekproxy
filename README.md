# Cek Proxy DM Digital

Portal self-service untuk customer yang membeli proxy lewat Shopee. Customer cukup memasukkan **nomor pesanan Shopee** untuk:

- melihat masa aktif dan tombol perpanjang (Shopee / WhatsApp),
- mengecek sisa bandwidth,
- melihat, copy, dan download daftar proxy (3 format),
- mengganti IP (replace) sesuai kuota,
- mengelola IP whitelist.

Selain paket **statis** (1 pesanan = 1 akun), aplikasi ini juga melayani paket **rotating**: customer mendapat satu kunci API untuk menarik proxy acak dari pool akun yang ditandai admin. Lihat [Produk rotating](#produk-rotating-api).

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
   Lakukan hal yang sama untuk [`0002_plan_info.sql`](supabase/migrations/0002_plan_info.sql) (kolom jenis proxy), [`0003_rotating.sql`](supabase/migrations/0003_rotating.sql) (produk rotating), dan [`0004_customer_accounts.sql`](supabase/migrations/0004_customer_accounts.sql) (akun customer, kode klaim, log WhatsApp). Semua file aman dijalankan ulang dan tidak mengubah data lama.
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
6. *(Opsional)* Hubungkan domain sendiri di **Settings → Domains** — lihat bagian berikutnya.

Setiap perubahan environment variable baru berlaku setelah **Redeploy** (menu Deployments, lalu ⋯ → Redeploy).

### Memasang domain sendiri

1. Beli domain, lalu tambahkan di **Vercel → Settings → Domains**. Ikuti instruksi DNS yang ditampilkan (ganti nameserver, atau tambah record A + CNAME). Sertifikat HTTPS dibuat otomatis.
2. Set env `SITE_URL` ke domain itu, mis. `https://dmproxy.xyz`, lalu **Redeploy**. Ini membuat judul dan gambar preview link memakai domain baru.
3. Alamat `*.vercel.app` tetap hidup dan tidak otomatis mengalihkan. Kalau ingin dialihkan, isi env `LEGACY_HOST` dengan alamat lama (mis. `namaproject.vercel.app`); semua kunjungan ke alamat lama diarahkan ke `SITE_URL` dengan path yang sama.
   Redirect-nya **sementara (307)**. Setelah yakin lancar, ubah `permanent: false` → `true` di [`next.config.ts`](next.config.ts) agar browser menyimpannya.
4. Endpoint rotating mengikuti alamat yang sedang dibuka customer, jadi halaman pesanan otomatis menampilkan `https://domain-baru/api/rotating?key=…` tanpa perubahan kode.
5. Untuk memberi tahu customer, isi env `PENGUMUMAN` (dan opsional `PENGUMUMAN_SAMPAI`) — lihat bagian berikutnya.

### Pita pengumuman untuk customer

Isi env `PENGUMUMAN` dengan satu kalimat, lalu redeploy. Pita biru muda akan muncul di halaman depan dan semua halaman pesanan.

```
PENGUMUMAN=Alamat baru layanan: dmproxy.xyz — simpan link ini ya.
PENGUMUMAN_SAMPAI=2026-12-31
```

- Customer bisa menutup pita; pilihan itu diingat di browser mereka.
- Mengganti teksnya membuat pita muncul lagi, walau sebelumnya sudah ditutup.
- Lewat 23:59 WIB tanggal `PENGUMUMAN_SAMPAI`, pita hilang sendiri tanpa perlu deploy ulang. Kosongkan `PENGUMUMAN` untuk mematikannya kapan saja.

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

**Jenis proxy (datacenter / residential / ISP)** diambil otomatis dari plan Webshare saat API key divalidasi, lalu disimpan di database. Jenisnya tampil di kolom **Jenis** pada Pool Akun, di rekap **Jenis proxy di pool** pada Dashboard, di halaman Semua Proxy (kolom + filter), dan sebagai label di halaman customer. Untuk akun lama yang ditambahkan sebelum fitur ini ada, klik **Sinkronkan info plan** di halaman Pool Akun, atau **Cek ulang API key** pada satu akun.

**Semua Proxy** menggabungkan seluruh proxy dari semua akun di pool dalam satu tabel: IP, port, username, password, negara, status valid, akun asal, dan nomor pesanan pemakainya. Ada pencarian, filter akun/negara/status, serta tombol Copy, Download .txt, dan Download .csv lengkap.

**Dashboard** menampilkan jumlah akun available, pesanan aktif, ringkasan pool rotating, dan daftar pesanan yang akan expired dalam 3 hari untuk di-follow-up di Shopee.

### Produk rotating (API)

Paket rotating memakai **pool gabungan**: sisa bandwidth dari akun-akun yang sudah dipakai customer statis bisa dijual lagi sebagai proxy rotating, tanpa server tambahan.

1. **Pool Akun → kolom Pool rotating**: klik **Ikutkan** pada akun yang boleh menyumbang proxy. Lewat tombol **Edit** Anda juga bisa mengisi **cadangan bandwidth (GB)**, yaitu jatah yang disisakan untuk pemilik akun. Contoh: akun 250 GB dengan cadangan 200 GB hanya menyumbang sampai pemakaian mencapai 50 GB, setelah itu akun otomatis keluar dari pool. Kosongkan cadangan jika akun boleh dipakai sampai limitnya.
2. **Pesanan → Tambah pesanan rotating (pool)**: isi nomor pesanan Shopee, tanggal expired, dan **batas permintaan per menit**. Pesanan rotating tidak menempel ke satu akun, jadi tidak perlu memilih akun.
3. Setelah tersimpan, kunci API (`dmr_...`) langsung tampil. Kirim link `https://domain-anda/pesanan/NOMORPESANAN` ke customer — halaman itu berisi kunci, alamat endpoint, contoh `curl`, dan daftar parameter.
4. Di halaman **Kelola pesanan** rotating ada kartu **Akses rotating**: salin kunci/endpoint, ubah batas per menit, atau **Ganti kunci API** kalau kuncinya bocor (kunci lama langsung berhenti bekerja).

Batas paket rotating = **masa aktif + jumlah permintaan per menit**. Saat pesanan expired atau dinonaktifkan, kunci API langsung ditolak.

**Cara pakai untuk customer:**

```
GET https://domain-anda/api/rotating?key=dmr_xxx&count=5&country=US&format=ip:port:user:pass
```

| Parameter | Isi | Keterangan |
| --- | --- | --- |
| `key` | `dmr_...` | Wajib. Bisa juga dikirim sebagai header `x-api-key` atau `Authorization: Bearer`. |
| `count` | 1–50 | Jumlah proxy sekali ambil. Default 1. |
| `country` | `US`, `SG`, `ID`, … | Opsional. Kosongkan untuk acak dari semua negara. |
| `format` | `ip:port:user:pass`, `user:pass@ip:port`, `ip:port`, `json` | Default `ip:port:user:pass`. |

Endpoint `GET /api/rotating/info?key=dmr_xxx` mengembalikan ukuran pool, daftar negara beserta jumlahnya, batas per menit, dan tanggal expired.

---

## Akun customer

Customer membuat akun sendiri dengan **nomor WhatsApp + password**, lalu mengklaim tiap pesanan memakai **kode klaim** yang Anda buat di panel admin. Setelah itu semua pesanannya tampil di satu halaman (`/akun`) — tidak perlu lagi menyimpan banyak link.

**Alur Anda sebagai admin:**

1. Buat pesanan seperti biasa, dan isi **Nomor WhatsApp pembeli** di formulirnya (kolom baru). Nomor ini dipakai untuk mengirim kode klaim dan pengingat expired.
2. Buka **Kelola pesanan** → kartu **Akun customer & kode klaim** → **Buat kode klaim**.
3. Klik **Kirim ke +62…** untuk membuka WhatsApp dengan pesan siap kirim (berisi kode dan link pendaftaran).
4. Customer mendaftar di `/akun/daftar`, lalu memasukkan kode di `/akun/klaim`.

Catatan penting:

- Kode berlaku **7 hari**, **sekali pakai**, dan hangus begitu dipakai. Kode baru bisa dibuat kapan saja (kode lama langsung mati).
- Kalau pesanan salah diklaim, pakai **Lepas dari akun** lalu buat kode baru.
- Halaman **Customer** di panel admin memuat daftar akun, tombol **Reset password** (menghasilkan password sementara untuk dikirim lewat chat), **Blokir**, dan tombol **Buat kode klaim massal** untuk menyiapkan kode semua pesanan lama sekaligus.
- Belum ada layanan email, jadi lupa password ditangani admin lewat tombol reset itu.

### Mewajibkan login (masa transisi)

Selama `CUSTOMER_LOGIN_REQUIRED_FROM` kosong, halaman pesanan tetap bisa dibuka hanya dengan nomor pesanan seperti dulu. Isi env itu dengan tanggal (mis. `2026-12-01`) untuk mulai mewajibkan akun:

- **Sebelum** tanggal tersebut: halaman pesanan terbuka, tapi muncul pita peringatan berisi tanggal dan tombol daftar/masuk.
- **Sesudahnya**: pengunjung tanpa akun dialihkan ke halaman masuk; yang sudah masuk tapi pesanannya belum diklaim diarahkan ke halaman klaim; pesanan milik akun lain ditolak dengan pesan jelas. Aturan yang sama berlaku untuk semua API `/api/pesanan/*`, jadi tidak ada pintu belakang.

Beri jarak minimal 2–4 minggu dan kirimkan kode klaim lebih dulu, supaya customer lama tidak kaget kehilangan akses.

---

## Pengingat WhatsApp otomatis

Sekali sehari aplikasi mengirim pengingat ke WhatsApp customer: **3 hari sebelum** expired, **1 hari sebelum**, dan **saat pesanan berakhir**. Nomor yang dipakai adalah nomor akun customer, atau nomor yang Anda catat di pesanan kalau belum diklaim.

**Cara mengaktifkan:**

1. Daftar di penyedia gateway WhatsApp (bawaan: [Fonnte](https://fonnte.com)), sambungkan nomor WhatsApp Anda, lalu salin tokennya.
2. Di Vercel isi `FONNTE_TOKEN` dan `CRON_SECRET` (acak, minimal 16 karakter), lalu **Redeploy**.
3. Jadwal hariannya sudah tertulis di [`vercel.json`](vercel.json) (pukul 09.00 WIB). Paket Vercel Hobby hanya mengizinkan sekitar satu eksekusi cron per hari.
4. Cek hasilnya di panel admin → **Notifikasi**: ada riwayat pengiriman, tombol **Simulasi (tanpa kirim)**, dan tombol **Kirim sekarang**.

Pengaman yang sudah terpasang: satu pesanan tidak pernah menerima pesan yang sama dua kali (dijaga indeks unik di tabel `wa_messages`), maksimal 40 pesan per putaran dengan jeda antar pesan, dan seluruh fitur mati total kalau `FONNTE_TOKEN` kosong.

> ⚠️ Fonnte adalah gateway tidak resmi yang memakai nomor WhatsApp Anda sendiri. Kalau penerima menandai pesan sebagai spam, nomor Anda bisa diblokir WhatsApp. Karena itu pesan hanya dikirim ke customer yang nomornya mereka berikan sendiri, isinya transaksional, dan ada cara berhenti. Jalur resmi (Meta WhatsApp Cloud API) bisa dipasang menyusul lewat modul yang sama, [`lib/wa-sender.ts`](lib/wa-sender.ts).

---

## 6. Environment variables

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `SUPABASE_URL` | Ya (produksi) | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya (produksi) | Service role / secret key. **Hanya server.** |
| `ADMIN_PASSWORD` | Ya | Password login `/admin`. Mengganti password otomatis mengeluarkan semua sesi admin. |
| `SESSION_SECRET` | Ya (produksi) | Kunci tanda tangan cookie sesi, minimal 32 karakter |
| `WEBSHARE_TEST_MODE` | Tidak | `true` = data proxy palsu. Jika `true` dan Supabase kosong, memakai DB memori. |
| `SITE_URL` | Tidak | Alamat publik aplikasi, mis. `https://dmproxy.xyz`. Dipakai untuk kartu preview link. Default `https://dmproxy.xyz`. |
| `LEGACY_HOST` | Tidak | Alamat lama yang dialihkan ke `SITE_URL`, mis. `namaproject.vercel.app`. Kosong = tidak ada redirect. |
| `PENGUMUMAN` | Tidak | Teks pita pengumuman di halaman customer. Kosong = pita tidak tampil. |
| `PENGUMUMAN_SAMPAI` | Tidak | `YYYY-MM-DD`. Lewat 23:59 WIB tanggal itu, pita pengumuman hilang sendiri. |
| `CUSTOMER_LOGIN_REQUIRED_FROM` | Tidak | `YYYY-MM-DD`. Mulai tanggal itu halaman pesanan hanya bisa dibuka lewat akun customer. Kosong = masa transisi (link lama tetap jalan). |
| `FONNTE_TOKEN` | Tidak | Token gateway WhatsApp untuk pengingat otomatis. Kosong = fitur mati total. |
| `FONNTE_ENDPOINT` | Tidak | Alamat API gateway, kalau bukan `https://api.fonnte.com/send`. |
| `CRON_SECRET` | Tidak | Minimal 16 karakter. Melindungi `/api/cron/notify`; Vercel Cron otomatis mengirimnya. |

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
  | API rotating dengan kunci salah | 90 / menit (anti coba-coba kunci) |
  | API rotating dengan kunci benar | sesuai batas per menit pesanan tersebut |
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

### Pool rotating ([`lib/services/rotating.ts`](lib/services/rotating.ts))

- Pool dibangun dari akun dengan `rotating_enabled = true` dan status bukan `disabled`, maksimal 3 akun diproses bersamaan.
- Jika akun punya **cadangan bandwidth** (`rotating_reserve_gb`), pemakaiannya dicek lebih dulu. Akun dikeluarkan dari pool bila `terpakai >= limit - cadangan`, atau bila data bandwidth-nya gagal dibaca (tidak ada asumsi diam-diam bahwa pemakaiannya 0).
- Hanya proxy berstatus `valid` yang masuk pool. Hasilnya di-cache 60 detik, dan cache langsung dibuang saat admin mengubah akun atau menyalakan/mematikan keikutsertaan pool.
- Kunci API dibuat acak 128-bit (`dmr_` + 32 hex, lihat [`lib/api-key.ts`](lib/api-key.ts)) dan disimpan unik di tabel `orders`. Pesanan rotating tidak memakai `account_id` maupun kuota replace.
- Validasi akses ada di [`lib/services/rotating-access.ts`](lib/services/rotating-access.ts): format kunci → pesanan rotating → aktif → belum expired → batas permintaan per menit (tabel `rate_limits`, kunci `rotating:<order_id>`, jadi batasnya berlaku lintas instance Vercel).
- Semua balasan API rotating memakai `cache-control: no-store`.

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
  api/rotating/                API rotating (ambil proxy acak) + /info
  api/cron/notify/             pengingat WhatsApp harian (dipanggil Vercel Cron)
  akun/                        daftar, masuk, klaim, dan dashboard akun customer
  api/my-ip/                   deteksi IP pengunjung dari header request
  admin/login/                 login admin
  admin/(panel)/…              dashboard, pool akun, pesanan
  admin/actions.ts             server actions admin (validasi zod)
components/                    UI (customer/, admin/, ui.tsx, icons.tsx)
lib/
  webshare.ts                  klien API Webshare (+ webshare-mock.ts untuk mode test)
  db/                          repository Supabase & memori
  services/                    logika pesanan, cache data proxy, replace, pool rotating
  api-key.ts                   pembuatan & pola kunci API rotating + kode klaim
  customer-session.ts          sesi akun customer (cookie bertanda tangan)
  password.ts                  hashing password (scrypt bawaan Node)
  wa-number.ts, wa-sender.ts   normalisasi nomor & pengiriman WhatsApp
  rate-limit.ts, session.ts, cache.ts, …
supabase/
  migrations/0001_init.sql     skema + fungsi atomik
  migrations/0002_plan_info.sql info plan (jenis proxy)
  migrations/0003_rotating.sql pool rotating + pesanan rotating
  migrations/0004_customer_accounts.sql  akun customer, kode klaim, log WhatsApp
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
