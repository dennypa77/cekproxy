/**
 * Kamus bahasa Indonesia — SUMBER KEBENARAN bentuk kamus.
 *
 * Tipe `Kamus` diturunkan dari berkas ini, dan `en.ts` wajib mencocokinya.
 * Artinya: menambah kunci di sini membuat build GAGAL sampai terjemahan
 * Inggrisnya ditulis juga. Itu disengaja — lebih baik ketahuan saat build
 * daripada muncul sebagai teks kosong di halaman pembeli.
 *
 * Jangan pakai `as const`: tipe literal akan membuat en.ts mustahil cocok.
 */
export const id = {
  umum: {
    pesanSekarang: "Pesan sekarang",
    pesanLewatWa: "Pesan lewat WhatsApp",
    pesan: "Pesan",
    beliPaket: "Beli paket",
    lihatHarga: "Lihat harga",
    bantuan: "Bantuan",
    tanyaKami: "Tanya kami",
    masuk: "Masuk",
    daftar: "Daftar",
    buatAkun: "Buat akun",
    tutupPengumuman: "Tutup pengumuman",
    gantiBahasa: "Ganti bahasa",
  },

  nav: {
    harga: "Harga",
    caraPesan: "Cara pesan",
    faq: "FAQ",
    blog: "Blog",
    akunSaya: "Akun saya",
    menuUtama: "Menu utama",
  },

  hero: {
    judulAtas: "Proxy cepat untuk",
    judulBawah: "segala kebutuhan",
    ringkasCheckout: "Datacenter dan residential, aktif di hari yang sama. Pesan online dan kelola semua pesanan dari satu dashboard.",
    ringkasWa: "Datacenter dan residential, aktif di hari yang sama. Pesan lewat chat dan kelola semua pesanan dari satu dashboard.",
    tanpaBiaya: "Bayar paketnya saja —",
    tanpaBiayaAksen: "tanpa biaya layanan",
    sudahPunyaAkun: "Sudah punya akun?",
    masukDiSini: "Masuk di sini",
    lanjutanCheckout: " · pesanan baru dibayar online.",
    lanjutanWa: " · pembeli baru mendapat kode klaim dari kami.",
    ringkasBawah: "Mulai $3 · paket {hari} hari · aktif di hari yang sama",
  },

  keunggulan: {
    dashboard: {
      judul: "Dashboard sendiri",
      isi: "Cek sisa bandwidth, masa aktif, dan daftar IP kapan saja — cukup dengan nomor pesanan.",
    },
    ganti: {
      judul: "Ganti IP sendiri",
      isi: "Tukar IP yang mati atau terblokir sendiri sesuai kuota, lengkap dengan pilihan negara.",
    },
    whitelist: {
      judul: "Whitelist IP",
      isi: "Tentukan sendiri IP mana yang boleh memakai proxy Anda, tanpa menunggu admin.",
    },
    jenis: {
      judul: "Datacenter & residential",
      isi: "Pilih yang cepat dan murah, atau IP rumahan yang lolos di situs ketat.",
    },
  },

  rotating: {
    eyebrow: "Untuk otomasi",
    judul: "Paket rotating lewat API",
    isi: "Satu alamat API dan satu kunci rahasia untuk menarik proxy acak dari pool kami — tentukan jumlah dan negaranya langsung dari skrip Anda. Dibatasi masa aktif dan permintaan per menit, tanpa hitungan GB.",
    tombolHarga: "Lihat harga rotating",
  },

  caraPesan: {
    judul: "Cara",
    judulAksen: "pesan",
    ringkas: "Hanya empat langkah. Harga yang tertera sudah final — tanpa biaya layanan marketplace.",
    checkout: [
      {
        judul: "Buat akun",
        isi: "Daftar dengan nomor WhatsApp dan kata sandi. Semua pesanan Anda tersimpan di akun itu.",
      },
      { judul: "Pilih paket", isi: "Tentukan jumlah IP dan bandwidth yang Anda butuhkan, lalu tekan Beli untuk mendapat invoice." },
      {
        judul: "Bayar nominal persis",
        isi: "QRIS, BCA, atau BRI. Tiga digit terakhir khusus untuk invoice Anda — itulah cara kami mengenali transfernya.",
      },
      {
        judul: "Kami aktifkan",
        isi: "Setiap pembayaran kami cek manual, biasanya dalam 2 jam. Proxy lalu muncul di dashboard Anda.",
      },
    ],
    wa: [
      { judul: "Pilih paket", isi: "Tentukan jumlah IP dan bandwidth yang Anda butuhkan dari daftar harga di atas." },
      {
        judul: "Chat kami",
        isi: "Tekan Pesan — paket pilihan Anda sudah terisi di chat. Kami balas dengan cara pembayarannya.",
      },
      {
        judul: "Bayar dan terima kode",
        isi: "Begitu pembayaran masuk, kami aktifkan proxy-nya dan mengirimkan kode klaim lewat chat.",
      },
      {
        judul: "Buka dashboard",
        isi: "Buat akun dengan nomor WhatsApp, masukkan kodenya, lalu kelola semua pesanan di satu tempat.",
      },
    ],
  },

  cekPesanan: {
    judul: "Cek",
    judulAksen: "pesanan",
    ringkas: "Sudah pernah beli? Masukkan nomor pesanan untuk melihat daftar proxy, sisa bandwidth, dan masa aktifnya. Punya lebih dari satu pesanan? Buat akun supaya semuanya ada di satu halaman.",
    punyaBanyakJudul: "Punya beberapa pesanan?",
    punyaBanyakIsi: "Buat akun dengan nomor WhatsApp, lalu klaim tiap pesanan dengan kode yang kami kirim — semuanya di satu halaman.",
    nomorDiManaJudul: "Nomor pesanan saya di mana?",
    nomorDiManaIsi: "Kami mengirim nomor pesanan lewat WhatsApp tepat setelah proxy Anda aktif — simpan chat itu.",
  },

  footer: {
    tagline: "Provide EZ Service",
    produk: "Produk",
    produkDatacenter: "Proxy datacenter",
    produkResidential: "Proxy residential",
    produkRotating: "API proxy rotating",
    produkCekIp: "Cek IP saya",
    produkBlog: "Blog",
  },

  faq: {
    judul: "Pertanyaan",
    judulAksen: "umum",
    masihBingung: "Masih ada yang ingin ditanyakan?",
    item: {
      bedaJenis: {
        t: "Apa bedanya proxy datacenter dan residential?",
        j: "Proxy datacenter memakai IP dari pusat data: lebih cepat dan lebih murah per IP, cocok kalau Anda butuh banyak IP sekaligus. Proxy residential memakai IP dari jaringan rumah sungguhan, jadi Anda terlihat seperti pengguna biasa — lebih pas untuk situs yang ketat. Jumlahnya lebih sedikit dan harganya lebih mahal per IP.",
      },
      masaAktif: {
        t: "Berapa lama masa aktif tiap paket?",
        j: "{hari} hari terhitung sejak proxy Anda diaktifkan. Sisa harinya bisa dicek kapan saja dari dashboard, dan kami mengingatkan lewat WhatsApp menjelang habis supaya bisa diperpanjang sekali tekan.",
      },
      caraPakai: {
        t: "Bagaimana cara memakai proxy-nya?",
        j: "Begitu pesanan aktif, buka dengan nomor pesanan Anda. Anda akan mendapat daftar IP lengkap dengan host, port, username, dan password — bisa disalin satu per satu atau diunduh sebagai file .txt dalam tiga format. Tinggal dimasukkan ke antidetect browser, aplikasi, atau tool apa pun yang Anda pakai.",
      },
      gantiIp: {
        t: "Bisa mengganti IP yang mati atau terblokir?",
        j: "Bisa. Setiap pesanan punya kuota ganti IP yang bisa Anda pakai sendiri dari dashboard, tanpa menunggu admin. Saat mengganti, Anda juga bisa memilih negara tujuan selama stok ada. Kalau kuotanya habis, chat kami lewat WhatsApp.",
      },
      pilihNegara: {
        t: "Bisa memilih negara tertentu?",
        j: "Bisa, lewat menu ganti IP di dashboard. Negara yang tersedia mengikuti stok saat itu, jadi daftarnya bisa berubah. Kalau negara yang Anda butuhkan sedang kosong, beri tahu kami.",
      },
      bandwidthHabis: {
        t: "Bagaimana kalau bandwidth habis sebelum masa aktif selesai?",
        j: "Pemakaian dan sisa bandwidth terlihat di dashboard. Kalau habis lebih cepat, Anda bisa memesan paket baru atau chat kami untuk menambah.",
      },
      adaRotating: {
        t: "Ada paket rotating lewat API?",
        jCheckout: "Ada. Anda mendapat satu alamat API dan kunci rahasia untuk menarik proxy acak dari pool kami, dengan jumlah dan negara sesuai pilihan Anda. Paket rotating dijual per durasi — 7, 14, atau 30 hari — untuk pool datacenter maupun residential, dan bisa langsung dibeli dari dashboard. Tidak ada hitungan GB; batas wajarnya {gb} GB per 30 hari.",
        jWa: "Ada. Anda mendapat satu alamat API dan kunci rahasia untuk menarik proxy acak dari pool kami, dengan jumlah dan negara sesuai pilihan Anda. Paket rotating dijual per durasi — 7, 14, atau 30 hari. Chat kami lewat WhatsApp untuk memesannya.",
      },
      batasWajar: {
        t: "Apa maksud batas wajar di paket rotating?",
        j: "Paket rotating tidak punya hitungan GB, tapi pool-nya dipakai bersama customer lain, jadi kami minta pemakaiannya tetap di bawah {gb} GB per 30 hari. Kami tidak sedang menghitung byte untuk menjebak Anda — kalau pemakaiannya jauh melewati itu, kami chat dulu lewat WhatsApp dan mencarikan paket yang lebih pas. Tidak ada pemutusan tanpa dibicarakan.",
      },
      caraBayar: {
        t: "Bagaimana cara memesan dan membayar?",
        jCheckout: "Buat akun, tekan Pesan pada paket yang Anda mau, lalu Anda mendapat invoice berisi nominal persis untuk ditransfer lewat QRIS, BCA, atau BRI. Tidak ada payment gateway, jadi setiap transfer kami cek manual — proxy biasanya aktif dalam 2 jam. Harga yang tertera sudah final, tanpa tambahan biaya layanan marketplace.",
        jWa: "Tekan Pesan pada paket yang Anda mau, lalu WhatsApp terbuka dengan pilihan Anda sudah terisi. Kami balas dengan cara pembayarannya, lalu mengaktifkan proxy dan mengirim kode klaim. Harga yang tertera sudah final, tanpa tambahan biaya layanan marketplace.",
      },
      kenapaLebihMurah: {
        t: "Kenapa pesan langsung lebih murah?",
        j: "Harga paketnya sama. Bedanya, marketplace biasanya menambahkan biaya admin dan layanan di sisi pembeli — biaya itu hilang kalau Anda pesan langsung ke kami.",
      },
    },
  },

  harga: {
    judul: "Pilih",
    judulAksen: "paket",
    ringkasCheckout:
      "Pesan online: buat akun, pilih paket, lalu bayar. Semua harga sudah termasuk dashboard pengelolaan. Harga ditampilkan dalam USD (rupiah ikut tercantum).",
    ringkasWa:
      "Pilih paket, lalu tekan Pesan — WhatsApp terbuka dengan pilihan Anda. Semua harga sudah termasuk dashboard pengelolaan. Harga ditampilkan dalam USD (rupiah ikut tercantum).",
    tanpaBiaya: "Tanpa biaya layanan",
    aktifHariSama: "Aktif di hari yang sama",
    kolom: {
      jumlahIp: "Jumlah IP",
      bandwidth: "Bandwidth",
      harga: "Harga",
      perIp: "Per IP",
      aksi: "Aksi",
      durasi: "Durasi",
      perHari: "Per hari",
    },
    labelMasaAktif: "paket {hari} hari",
    palingLaris: "Paling laris",
    palingHemat: "Paling hemat",
    termasukJudul: "Setiap paket sudah termasuk",
    termasuk: [
      "Dashboard untuk memantau bandwidth & daftar IP",
      "Ganti IP sendiri sesuai kuota",
      "Atur whitelist IP sendiri",
      "Pilih negara saat mengganti IP",
    ],
    kategori: {
      datacenter: {
        ringkasan: "Kecepatan tinggi dengan harga per IP paling murah. Pilihan utama kalau Anda butuh banyak IP sekaligus.",
        cocokUntuk: ["Banyak akun sekaligus", "Kecepatan tinggi", "Biaya per IP termurah"],
      },
      residential: {
        ringkasan: "IP dari jaringan rumah sungguhan, jadi Anda terlihat seperti pengguna biasa. Cocok untuk situs yang ketat.",
        cocokUntuk: ["Situs ketat", "Terlihat seperti pengguna rumahan", "Sampai 100 IP"],
      },
    },
    rotatingJudul: "API",
    rotatingJudulAwal: "Rotating",
    rotatingIsi:
      "Satu kunci API yang memberi Anda proxy acak dari pool bersama setiap kali dipanggil. Dijual per durasi, jadi tidak ada hitungan GB yang perlu diawasi. Berlaku batas wajar — lihat FAQ.",
    rotatingBadge: ["Tanpa hitungan GB", "Bisa pilih negara", "Kunci API langsung jadi"],
    poolBersama: "Pool bersama",
    poolSuffix: "pool",
  },

  cariPesanan: {
    label: "Nomor pesanan",
    placeholder: "mis. 240913ABCD1234",
    tombol: "Cek pesanan",
    sedangCek: "Mengecek…",
    wajibIsi: "Nomor pesanan wajib diisi",
    kosong: "Masukkan nomor pesanan Anda.",
    gagalKoneksi: "Tidak bisa terhubung",
    gagalKoneksiIsi: "Periksa koneksi internet Anda lalu coba lagi.",
  },

  merek: {
    cepat: "Cepat",
    aman: "Aman",
    terpercaya: "Terpercaya",
  },

  akun: {
    kembali: "← Beranda",
    eyebrow: "Akun saya",
    judul: "Pesanan",
    aksen: "Anda",
    keluar: "Keluar",

    masuk: {
      meta: "Masuk",
      judul: "Masuk ke",
      aksen: "akun Anda",
      ringkas: "Gunakan nomor WhatsApp yang Anda pakai saat mendaftar untuk melihat semua pesanan di satu tempat.",
    },
    daftar: {
      meta: "Buat Akun",
      judul: "Buat",
      aksen: "akun",
      ringkas:
        "Satu akun untuk semua pesanan Anda. Nomor WhatsApp dipakai untuk masuk dan untuk menghubungi Anda saat pesanan hampir habis masa aktifnya.",
    },
    klaim: {
      meta: "Klaim Pesanan",
      judul: "Klaim",
      aksen: "pesanan",
      ringkasDenganNomor: "Masukkan kode klaim untuk pesanan {pesanan}. Kodenya kami kirim lewat WhatsApp.",
      ringkas: "Masukkan kode klaim yang kami kirim lewat WhatsApp. Satu kode untuk satu pesanan.",
      belumPunyaJudul: "Belum punya kode?",
      belumPunyaIsi:
        "Chat kami di WhatsApp dan sebutkan nomor pesanan Anda. Kodenya berlaku 7 hari dan hanya bisa dipakai sekali.",
      mintaKode: "Minta kode klaim",
      kembaliKePesanan: "Kembali ke pesanan saya",
    },

    form: {
      noWa: "Nomor WhatsApp",
      noWaBantuan: "Boleh ditulis 0812…, +62812…, atau 62812… — sama saja.",
      nama: "Nama",
      password: "Kata sandi",
      passwordMinimal: "Minimal 8 karakter.",
      ulangiPassword: "Ulangi kata sandi",
      kodeKlaim: "Kode klaim dari admin",
      tombolMasuk: "Masuk",
      tombolDaftar: "Buat akun",
      tombolKlaim: "Tambahkan pesanan",
      lupaPassword: "Lupa kata sandi? Hubungi admin lewat WhatsApp.",
      sudahPunyaAkun: "Sudah punya akun?",
      masukDiSini: "Masuk di sini",
      belumPunyaAkun: "Belum punya akun?",
      daftarDulu: "Daftar dulu",
    },
  },

  pesanan: {
    meta: "Pesanan Saya",
    status: { aktif: "Aktif", akanExpired: "Segera habis", expired: "Habis", nonaktif: "Nonaktif" },
    invoiceJudul: "Invoice",
    invoiceAksen: "Anda",
    invoiceRingkas: "Pesanan muncul di bawah setelah pembayaran kami cek — biasanya dalam 2 jam.",
    buka: "Buka →",
    beliPaket: "+ Beli paket",
    pesanPaket: "Pesan paket",
    klaimPesanan: "Klaim pesanan",
    belumAdaJudul: "Belum ada",
    belumAdaAksen: "pesanan",
    belumAdaCheckout:
      "Pilih paket lalu bayar lewat QRIS atau transfer bank — atau, kalau Anda sudah memesan di tempat lain, masukkan kode klaim yang kami berikan.",
    belumAdaWa:
      "Chat kami di WhatsApp untuk memesan — atau, kalau sudah memesan, masukkan kode klaim yang kami berikan.",
    lihatPaket: "Lihat paket",
    pesanLewatWa: "Pesan lewat WhatsApp",
    klaimDenganKode: "Klaim pesanan dengan kode",
    mintaKode: "Minta kode ke kami",
    jumlahSatu: "{n} pesanan di akun ini. Klik salah satu untuk melihat daftar proxy, bandwidth, dan pengaturannya.",
    bukaDashboard: "Buka dashboard →",
    halamanDitutup: "Halaman pesanan ini sudah ditutup",
    perpanjang: "Perpanjang",
    aktifSampai: "Aktif sampai {tanggal} · sisa {hari} hari",
    berakhir: "Berakhir {tanggal}",
    renewalSuffix: " (perpanjangan)",
  },

  beli: {
    meta: "Beli Paket",
    eyebrow: "Checkout",
    judul: "Pilih",
    aksen: "paket",
    ringkas:
      "Bayar lewat QRIS atau transfer bank. Setiap pembayaran kami cek manual, jadi proxy Anda biasanya siap dalam 2 jam.",
    invoiceBerjalan: "Invoice berjalan",
    kembaliKePesanan: "← Pesanan saya",
  },

  invoiceStatus: {
    menungguBayar: "Menunggu pembayaran",
    menungguVerifikasi: "Sedang dicek",
    disetujui: "Selesai",
    ditolak: "Ditolak",
    kedaluwarsa: "Kedaluwarsa",
    dibatalkan: "Dibatalkan",
  },

  invoice: {
    meta: "Invoice",
    judulHalaman: "Invoice",
    aksenHalaman: "Anda",
    transferPersis: "Transfer persis",
    nominalInvoice: "Nominal invoice",
    salinNominal: "Nominal",
    setaraUsd: "≈{usd} — ditagih dalam rupiah, jadi kirimkan nominal rupiah di atas.",
    peringatanAwal: "Kirim nominalnya",
    peringatanTebal: "persis",
    peringatanAkhir:
      ", termasuk 3 digit terakhir ({kode}). Itulah cara kami mengenali pembayaran Anda — nominal yang dibulatkan tidak bisa dicocokkan otomatis.",
    paket: "Paket",
    durasi: "Durasi",
    hargaPaket: "Harga paket",
    kodeUnik: "Kode unik",
    sisaWaktu: "{waktu} lagi untuk membayar",
    bayarDengan: "Bayar dengan",
    nomorRekening: "Nomor rekening",
    atasNama: "Atas nama",
    sudahTransfer: "Saya sudah transfer",
    sudahTransferBantuan: "Tekan ini hanya setelah transfer benar-benar berhasil. Kami langsung mendapat kabarnya.",
    batalkan: "Batalkan invoice ini",
    langkahJudul: "Selanjutnya",
    langkahAksen: "apa",
    langkah: [
      { judul: "Konfirmasi diterima", detail: "1–3 menit" },
      { judul: "Pembayaran kami cek", detail: "manual, tanpa payment gateway" },
      { judul: "Proxy diaktifkan", detail: "biasanya dalam 0–2 jam" },
    ],
    catatanManual:
      "Pembayaran kami cek manual, jadi tidak ada yang dikonfirmasi otomatis. Pesanan akan muncul di halaman akun Anda begitu selesai.",
    lunasJudul: "Pembayaran diterima",
    lunasIsi: "Pesanan Anda sudah aktif. Buka dari halaman akun.",
    ditolakJudul: "Invoice ditolak",
    ditolakBawaan: "Silakan hubungi kami lewat WhatsApp.",
    kedaluwarsaJudul: "Invoice kedaluwarsa",
    kedaluwarsaIsi:
      "Invoice ini sudah melewati batas 24 jam, jadi nominalnya tidak lagi dipesan. Buat invoice baru — atau chat kami kalau uangnya terlanjur dikirim.",
    gagalSalin: "Gagal menyalin — silakan salin manual",
  },

  katalog: {
    judulCheckout: "Checkout",
    judulPerpanjang: "Perpanjang",
    aksenPerpanjang: "pesanan",
    beli: "Beli",
    batal: "Batal",
    buatInvoice: "Buat invoice",
    perpanjangJudul: "Perpanjang",
    perpanjangAksen: "pesanan yang ada",
    perpanjangRingkas:
      "Perpanjangan menambah masa aktif pesanan yang sama — IP, kunci API, dan dashboard-nya tetap.",
    perpanjangTombol: "Perpanjang →",
    bukaInvoice: "Buka invoice {no}",
    aktifSampai: "Aktif sampai {tanggal}",
    rotatingJudul: "Rotating",
    rotatingAksen: "API",
    rotatingRingkas:
      "Satu kunci API yang memberi Anda proxy acak dari pool bersama setiap kali dipanggil. Dijual per durasi, jadi tidak ada hitungan GB yang perlu diawasi. Berlaku batas wajar — lihat FAQ.",
    poolLabel: "pool",
    proxiesSuffix: "proxy",
    paketLabel: "Paket",
    paketBantuan: "Dipilih otomatis dari pesanan Anda sekarang. Ubah kalau ingin ukuran lain.",
    perpanjangCatatan: "Memperpanjang pesanan {no} — kami tambahkan {durasi} dari tanggal berakhirnya sekarang.",
    rotatingRingkasPaket: " · pool bersama, satu kunci API",
    paketSuffix: "",
    metodeBayar: "Metode pembayaran",
    catatanLabel: "Catatan untuk kami (opsional)",
    catatanPlaceholder: "mis. kota tertentu, atau hal lain yang perlu kami tahu",
    infoNominal:
      "Kami akan menunjukkan nominal persis yang harus ditransfer, sampai 3 digit terakhir — itulah cara kami mencocokkan pembayaran Anda.",

    lokasiJudul: "Lokasi",
    lokasiPreferensi: "(preferensi)",
    lokasiAlokasi: "({jumlah} IP untuk dibagi)",
    lokasiBersihkan: "Bersihkan",
    lokasiAcak: "Acak — biar kami yang pilih yang terbaik",
    lokasiSemuaTeralokasi: "Semua {jumlah} IP sudah dibagi.",
    lokasiSisa: "Sisa {sisa} dari {jumlah} IP yang harus dibagi.",
    lokasiKelebihan: "Kelebihan {lebih} IP — kurangi di salah satu negara.",
    lokasiTambah: "Tambah",
    lokasiHapus: "Hapus",
    lokasiJumlahAria: "Jumlah IP di {negara}",
    lokasiCatatanRotating:
      "Anda tetap bisa meminta negara mana pun di tiap panggilan API — ini hanya memberi tahu kami negara mana yang perlu kami siapkan.",
  },

  seo: {
    lihatHarga: "Lihat harga",

    datacenter: {
      metaTitle: "Proxy Datacenter — Cepat & Terjangkau",
      metaDesc:
        "Beli proxy datacenter yang cepat mulai $4. 50–1.000 IP, aktif di hari yang sama, dengan dashboard sendiri untuk ganti IP dan atur whitelist. Cocok untuk multi-akun dan otomasi bervolume tinggi.",
      badge: "Datacenter",
      judul: "Proxy",
      aksen: "datacenter",
      ringkasTambahan:
        " Kecepatan tinggi, harga per IP paling murah, dan aktif di hari yang sama — pilihan utama kalau Anda butuh banyak IP sekaligus untuk multi-akun atau otomasi.",
      gunaUntuk: [
        { judul: "Banyak akun sekaligus", isi: "Harga per IP yang murah memudahkan menjalankan banyak akun secara paralel." },
        { judul: "Otomasi bervolume tinggi", isi: "Latensi rendah dan throughput besar untuk scraping, checker, dan bot yang butuh kecepatan." },
        { judul: "Kebutuhan IP banyak", isi: "Pesan 50 sampai 1.000 IP dalam satu paket dan kelola semuanya dari satu dashboard." },
      ],
      hargaJudul: "Harga proxy datacenter",
      hargaRingkas:
        "Harga dalam USD (rupiah ikut tercantum). Setiap paket sudah termasuk dashboard penuh, kuota ganti IP, dan pengaturan whitelist.",
      lintasAwal: "Butuh IP residential?",
      lintasTautan: "Lihat proxy residential",
    },

    residential: {
      metaTitle: "Proxy Residential — IP Rumahan Asli",
      metaDesc:
        "Beli proxy residential dengan IP dari jaringan rumah sungguhan. Aktif di hari yang sama, bisa pilih negara saat mengganti IP, dengan dashboard sendiri. Cocok untuk situs yang ketat.",
      badge: "Residential",
      judul: "Proxy",
      aksen: "residential",
      ringkasTambahan:
        " IP dari jaringan rumah sungguhan membuat Anda terlihat seperti pengguna biasa — pilihan yang tepat untuk situs yang menolak IP pusat data.",
      gunaUntuk: [
        { judul: "Situs ketat", isi: "IP jaringan rumahan lolos di situs yang memblokir rentang IP pusat data." },
        { judul: "Terlihat seperti pengguna asli", isi: "Trafiknya tampak datang dari koneksi rumahan biasa." },
        { judul: "Pilih negara", isi: "Tentukan negara tujuan saat mengganti IP, selama stoknya ada." },
      ],
      hargaJudul: "Harga proxy residential",
      hargaRingkas:
        "Harga dalam USD (rupiah ikut tercantum). Setiap paket sudah termasuk dashboard penuh, kuota ganti IP, dan pengaturan whitelist.",
      lintasAwal: "Butuh IP datacenter yang lebih murah?",
      lintasTautan: "Lihat proxy datacenter",
    },

    rotating: {
      metaTitle: "API Proxy Rotating — IP Acak dari Pool",
      metaDesc:
        "Satu alamat API dan kunci rahasia untuk menarik proxy acak dari pool kami. Dijual per durasi 7, 14, atau 30 hari, tanpa hitungan GB. Pilih jumlah dan negaranya langsung dari skrip Anda.",
      badge: "Untuk otomasi",
      judul: "API proxy",
      aksen: "rotating",
      ringkas:
        "Satu alamat API dan kunci rahasia untuk menarik proxy acak dari pool kami — tentukan jumlah dan negaranya langsung dari skrip Anda. Dijual per durasi: 7, 14, atau 30 hari, tanpa hitungan GB.",
      kapanBergantiTebal: "Anda yang menentukan kapan IP berganti.",
      kapanBerganti:
        " Setiap panggilan ke alamat API memberi Anda proxy acak yang baru — sampai {maks} sekaligus, maksimal {rate} panggilan per menit. Proxy yang Anda terima IP-nya tetap selama dipakai; panggil lagi kapan pun Anda mau IP yang berbeda. Ini API daftar proxy, bukan gateway backconnect yang mengganti IP di setiap permintaan.",
      fitur: [
        { judul: "Satu alamat, satu kunci", isi: "Tarik proxy sesuai kebutuhan dari satu alamat API yang diamankan kunci rahasia Anda." },
        { judul: "Pilih jumlah & negara", isi: "Tentukan berapa proxy yang Anda butuhkan dan dari negara mana, langsung di panggilan Anda." },
        { judul: "Tanpa hitungan GB", isi: "Dibatasi masa aktif dan permintaan per menit — bukan oleh gigabyte yang terpakai." },
      ],
      caraKerjaJudul: "Cara kerjanya",
      caraKerja: [
        "1. Kami siapkan pool Anda dan menerbitkan alamat API beserta kunci rahasianya.",
        "2. Skrip Anda memanggil alamat itu dengan jumlah dan negara yang diinginkan.",
        "3. Anda menerima proxy siap pakai — panggil lagi kapan pun Anda mau IP berbeda, sebatas limit per menit Anda.",
      ],
    },
  },

  dasbor: {
    meta: "Detail Pesanan",
    nomorPesanan: "Nomor pesanan",
    cekPesananLain: "Cek pesanan lain",
    semuaPesananSaya: "Semua pesanan saya",
    masaBerlaku: "Masa berlaku",
    periode: "Periode",
    berlakuSampai: "Berlaku sampai",
    habis: "Habis",
    perpanjang: "Perpanjang",
    tanpaBiaya: "Tanpa biaya layanan, harga sama.",

    status: { aktif: "Aktif", akanHabis: "Segera habis", habis: "Habis" },

    kedaluwarsa: {
      judulHabis: "Paket Anda",
      aksenHabis: "sudah habis",
      judulSegera: "Proxy Anda habis",
      aksenSegera: "dalam {hari} hari",
      isiHabis:
        "Proxy Anda sudah habis masa aktifnya sejak {tanggal}. Perpanjang sekarang untuk memakainya lagi. Halaman ini masih bisa dibuka sampai {batas}.",
      isiSegera: "Paket Anda berakhir pada {tanggal}. Perpanjang sebelum habis supaya proxy tetap tersambung.",
      tombol: "Perpanjang sekarang",
      catatan: "Perpanjang langsung ke admin: tanpa biaya layanan, harga sama.",
    },

    paketLain: {
      judul: "Butuh",
      aksen: "paket lain?",
      isi: "Tambah IP, perbesar bandwidth, atau coba jenis proxy lain.",
      mulaiDari: "mulai",
      lihatSemua: "Lihat semua paket",
    },

    gagal: {
      terlaluSering: "Terlalu sering mencoba",
      pesananLain: "Pesanan milik akun lain",
      pesananLainIsi:
        "Nomor pesanan ini sudah terhubung ke akun customer lain. Kalau ini memang pesanan Anda, hubungi admin lewat WhatsApp.",
      adaMasalah: "Ada yang bermasalah",
      adaMasalahIsi: "Server sedang bermasalah. Coba muat ulang halaman sebentar lagi.",
    },

    proxy: {
      judul: "Daftar",
      aksen: "proxy",
      memuat: "Memuat daftar proxy…",
      kosong: "Belum ada proxy di pesanan ini.",
      muatUlang: "Muat ulang",
      muatUlangAria: "Muat ulang daftar proxy",
      salin: "Salin proxy",
      tersalin: "Proxy disalin",
      gagalSalin: "Gagal menyalin. Silakan salin manual.",
      gagalSalinTxt: "Gagal menyalin. Pakai tombol Unduh .txt.",
      negara: "Negara",
      kataSandi: "Kata sandi",
      aksi: "Aksi",
      sebelumnya: "Sebelumnya",
      berikutnya: "Berikutnya",
      halamanAria: "Navigasi halaman proxy",
      sedangDiganti: "Penggantian IP masih diproses. Daftarnya akan diperbarui otomatis.",
      kuotaHabis: "Kuota ganti IP habis, hubungi admin",
      perpanjangUntukPakai: "Perpanjang pesanan Anda untuk memakai proxy, ganti IP, dan whitelist lagi.",
      lihatPerpanjangan: "Lihat pilihan perpanjangan",
    },

    bandwidth: {
      judul: "Bandwidth",
      sisa: "Sisa",
      dari: "dari",
      takTerbatas: "Tak terbatas",
      segar: "Data bandwidth diperbarui",
      muatUlang: "Muat ulang",
      muatUlangAria: "Muat ulang data bandwidth",
      memuat: "Memuat data bandwidth",
      sehat: "Aman",
      menipis: "Mulai menipis",
      kritis: "Kritis",
      hampirHabis: "Bandwidth hampir habis. Hubungi admin untuk menambah kuota.",
      takTersedia: "Data bandwidth sedang tidak tersedia",
      cobaLagi: "Silakan tekan Muat ulang sebentar lagi.",
    },

    whitelist: {
      judul: "Whitelist",
      ringkas: "Pakai proxy tanpa username & password dari jaringan dengan IP ini.",
      kosong: "Belum ada IP di whitelist.",
      muatUlangAria: "Muat ulang whitelist",
      contoh: "Contoh: 103.10.20.30",
      formatSalah: "Format IP tidak valid. Contoh yang benar: 103.10.20.30",
      ipTerisi: "IP Anda saat ini sudah terisi",
      ipGagalDeteksi: "IP Anda tidak terdeteksi. Silakan isi manual.",
    },

    ganti: {
      judul: "Ganti IP",
      tombol: "Ganti",
      ipProxy: "IP proxy",
      negaraAcak: "Acak (negara mana saja)",
      memuatNegara: "Memuat daftar negara…",
      peringatan: "IP lama tidak bisa dipakai lagi setelah diganti.",
      prosesLama: "Prosesnya bisa sampai ±30 detik. Jangan tutup halaman ini.",
      mengirim: "Mengirim permintaan…",
      mencari: "Mencari IP pengganti…",
      hampirSelesai: "Hampir selesai, mohon tunggu…",
      sedangProses: "Sedang diproses",
    },

    kredensial: {
      judul: "User & Password",
      ubah: "Ubah",
      simpan: "Simpan",
      menyimpan: "Menyimpan",
      acakUser: "Acak username",
      acakPassword: "Acak password",
      aturan: "Gunakan 8-32 huruf dan angka saja, tanpa spasi atau simbol.",
      belumBerubah: "Belum ada yang berubah. Ubah username atau password-nya dulu.",
      berhasil: "Username & password proxy berhasil diubah",
      tersalin: "Username & password disalin",
      gagalSalin: "Gagal menyalin.",
      peringatan: "Koneksi yang memakai kredensial lama akan langsung ditolak.",
    },

    rotating: {
      judulEndpoint: "Endpoint &",
      aksenEndpoint: "kunci API",
      alamat: "Alamat endpoint",
      kunci: "Kunci API",
      panggil: "Panggil alamat ini untuk mendapat proxy acak dari pool.",
      contohPerintah: "Contoh perintah",
      balasan: "Balasannya teks biasa, satu proxy per baris. Pakai proxy itu seperti biasa:",
      pool: "Pool",
      poolRingkas: "{jumlah} proxy aktif · batas {rate} permintaan/menit",
      poolDiperbarui: "Data pool diperbarui",
      negaraTersedia: "Negara tersedia",
      contohPakai: "Contoh pemakaian",
      opsiParameter: "Opsi parameter",
      parameter: "Parameter",
      nilai: "Nilai",
      keterangan: "Keterangan",
      descCount: "Jumlah proxy per permintaan. Bawaan 1.",
      descCountry: "Pilih negara tertentu. Kosongkan untuk acak.",
      descFormat: "Format keluaran. Bawaan ip:port:user:pass.",
      rahasia: "Jaga kerahasiaan kunci API Anda.",
      belumAdaNegara: "Belum ada data negara.",
      kunciMati: "Kunci API dinonaktifkan karena masa aktif paket sudah habis. Perpanjang untuk mengaktifkannya lagi.",
      gagalSalin: "Gagal menyalin. Silakan salin manual.",
    },
  },
};

export type Kamus = typeof id;
