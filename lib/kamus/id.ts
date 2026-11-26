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
};

export type Kamus = typeof id;
