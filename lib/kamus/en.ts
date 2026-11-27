import type { Kamus } from "./id";

/**
 * English dictionary.
 *
 * Typed against `Kamus`, which is derived from the Indonesian dictionary.
 * A missing or misspelled key is a build error, not a blank spot on a
 * customer's screen.
 */
export const en: Kamus = {
  umum: {
    pesanSekarang: "Order now",
    pesanLewatWa: "Order on WhatsApp",
    pesan: "Order",
    beliPaket: "Buy a plan",
    lihatHarga: "See pricing",
    bantuan: "Help",
    tanyaKami: "Ask us",
    masuk: "Log in",
    daftar: "Sign up",
    buatAkun: "Create account",
    tutupPengumuman: "Dismiss announcement",
    gantiBahasa: "Change language",
  },

  nav: {
    harga: "Pricing",
    caraPesan: "How to order",
    faq: "FAQ",
    blog: "Blog",
    akunSaya: "My account",
    menuUtama: "Main menu",
  },

  hero: {
    judulAtas: "Fast proxies for",
    judulBawah: "any online job",
    ringkasCheckout: "Datacenter and residential, ready the same day. Order online and manage all your orders from a single dashboard.",
    ringkasWa: "Datacenter and residential, ready the same day. Order over chat and manage all your orders from a single dashboard.",
    tanpaBiaya: "Pay only for your plan —",
    tanpaBiayaAksen: "no service fee",
    sudahPunyaAkun: "Already have an account?",
    masukDiSini: "Log in here",
    lanjutanCheckout: " · new orders are paid online.",
    lanjutanWa: " · new buyers get a claim code from us.",
    ringkasBawah: "From $3 · {hari}-day plans · same-day activation",
  },

  keunggulan: {
    dashboard: {
      judul: "Your own dashboard",
      isi: "Check remaining bandwidth, validity, and your IP list anytime — all with your order number.",
    },
    ganti: {
      judul: "Self-service IP replace",
      isi: "Swap dead or blocked IPs yourself within your quota, with country selection.",
    },
    whitelist: {
      judul: "IP whitelist",
      isi: "Decide which IPs may use your proxies yourself, no waiting on support.",
    },
    jenis: {
      judul: "Datacenter & residential",
      isi: "Pick fast and cheap, or home-user IPs that pass on strict sites.",
    },
  },

  rotating: {
    eyebrow: "For automation",
    judul: "Rotating plans via API",
    isi: "One API endpoint and a secret key to pull random proxies from our pool — choose the count and country straight from your script. Limited by validity and requests per minute, with no GB metering.",
    tombolHarga: "See rotating prices",
  },

  caraPesan: {
    judul: "How to",
    judulAksen: "order",
    ringkas: "Just four steps. Prices shown are final — no marketplace service fee.",
    checkout: [
      {
        judul: "Create an account",
        isi: "Sign up with your WhatsApp number and a password. That account is where every order of yours lives.",
      },
      { judul: "Pick a plan", isi: "Choose the IP count and bandwidth you need, then press Buy to get an invoice." },
      {
        judul: "Pay the exact amount",
        isi: "QRIS, BCA or BRI. The last 3 digits are unique to your invoice — that is how we recognise your transfer.",
      },
      {
        judul: "We activate it",
        isi: "We check every payment by hand, usually within 2 hours. Your proxies then appear in your dashboard.",
      },
    ],
    wa: [
      { judul: "Pick a plan", isi: "Choose the IP count and bandwidth you need from the pricing above." },
      {
        judul: "Message us",
        isi: "Press Order — your chosen plan is pre-filled in the chat. We'll reply with how to pay.",
      },
      {
        judul: "Pay and get your code",
        isi: "Once the payment arrives we activate your proxies and send you a claim code over chat.",
      },
      {
        judul: "Open your dashboard",
        isi: "Create an account with your WhatsApp number, enter the code, and manage every order in one place.",
      },
    ],
  },

  cekPesanan: {
    judul: "Check your",
    judulAksen: "order",
    ringkas: "Already bought? Enter your order number to see your proxy list, remaining bandwidth, and validity. Have more than one order? Create an account to keep them all in one place.",
    punyaBanyakJudul: "Have several orders?",
    punyaBanyakIsi: "Create an account with your WhatsApp number, then claim each order with the code we send — all on one page.",
    nomorDiManaJudul: "Where's my order number?",
    nomorDiManaIsi: "We send your order number over WhatsApp right after your proxies are activated — keep that chat handy.",
  },

  footer: {
    tagline: "Provide EZ Service",
    produk: "Products",
    produkDatacenter: "Datacenter proxies",
    produkResidential: "Residential proxies",
    produkRotating: "Rotating proxy API",
    produkCekIp: "What is my IP",
    produkBlog: "Blog",
  },

  faq: {
    judul: "Frequently asked",
    judulAksen: "questions",
    masihBingung: "Still have a question?",
    item: {
      bedaJenis: {
        t: "What's the difference between datacenter and residential proxies?",
        j: "Datacenter proxies use IPs from data centers: faster and cheaper per IP, ideal when you need many IPs at once. Residential proxies use IPs from real home networks, so you look like an ordinary user — a better fit for strict sites. They come in smaller counts and cost more per IP.",
      },
      masaAktif: {
        t: "How long is each plan active?",
        j: "{hari} days from the moment your proxies are activated. You can check the remaining days anytime from your dashboard, and we'll remind you over WhatsApp as it nears expiry so you can renew in one tap.",
      },
      caraPakai: {
        t: "How do I use the proxies?",
        j: "Once your order is active, open it with your order number. You'll get the full IP list with host, port, username and password — copy them one by one or download a .txt file in three formats. Just drop them into your antidetect browser, app, or any tool you use.",
      },
      gantiIp: {
        t: "Can I replace an IP that dies or gets blocked?",
        j: "Yes. Every order comes with a replace quota you can use yourself from the dashboard, no waiting on support. When replacing, you can also choose the destination country while stock lasts. If your quota runs out, message us on WhatsApp.",
      },
      pilihNegara: {
        t: "Can I choose a specific country?",
        j: "Yes, from the replace menu in your dashboard. Available countries follow current stock, so the list can change. If the country you need is out of stock, let us know.",
      },
      bandwidthHabis: {
        t: "What if my bandwidth runs out before the plan expires?",
        j: "Your bandwidth usage and remaining quota are shown in the dashboard. If it runs out early, you can order a new plan or message us to top up.",
      },
      adaRotating: {
        t: "Is there a rotating plan via API?",
        jCheckout: "Yes. You get a single API endpoint and a secret key to pull random proxies from our pool, with your choice of count and country. Rotating plans are sold by duration — 7, 14 or 30 days — in both datacenter and residential pools, and you can buy one straight from your dashboard. There is no GB counter; fair use is {gb} GB per 30 days.",
        jWa: "Yes. You get a single API endpoint and a secret key to pull random proxies from our pool, with your choice of count and country. Rotating plans are sold by duration — 7, 14 or 30 days. Message us on WhatsApp to order one.",
      },
      batasWajar: {
        t: "What does fair use mean on a rotating plan?",
        j: "Rotating plans have no GB counter, but they draw from a pool shared with other customers, so we ask you to stay under {gb} GB per 30 days. We are not counting bytes to catch you out — if your usage goes well past that, we'll message you on WhatsApp first and sort out a bigger plan together. Nothing is cut off without a conversation.",
      },
      caraBayar: {
        t: "How do I order and pay?",
        jCheckout: "Create an account, press Order on the plan you want, and you'll get an invoice with an exact amount to transfer by QRIS, BCA or BRI. There's no payment gateway, so we check each transfer by hand — proxies are usually live within 2 hours. Prices shown are final, with no marketplace service fee added.",
        jWa: "Press Order on the plan you want and WhatsApp opens with your choice pre-filled. We'll reply with payment details, then activate your proxies and send a claim code. Prices shown are final, with no marketplace service fee added.",
      },
      kenapaLebihMurah: {
        t: "Why is ordering directly cheaper?",
        j: "The package price is the same. The difference is that marketplaces usually add admin and service fees on the buyer's side — those disappear when you order directly from us.",
      },
    },
  },

  harga: {
    judul: "Choose your",
    judulAksen: "plan",
    ringkasCheckout:
      "Order online: create an account, pick a plan, and check out. Every price already includes the management dashboard. Prices shown in USD (IDR also listed).",
    ringkasWa:
      "Pick a plan and press Order — WhatsApp opens with your choice. Every price already includes the management dashboard. Prices shown in USD (IDR also listed).",
    tanpaBiaya: "No service fee",
    aktifHariSama: "Same-day activation",
    kolom: {
      jumlahIp: "IP count",
      bandwidth: "Bandwidth",
      harga: "Price",
      perIp: "Per IP",
      aksi: "Action",
      durasi: "Duration",
      perHari: "Per day",
    },
    labelMasaAktif: "{hari}-day plan",
    palingLaris: "Best seller",
    palingHemat: "Best value",
    termasukJudul: "Every plan includes",
    termasuk: [
      "Dashboard to track bandwidth & IP list",
      "Replace IPs within your quota",
      "Manage your own IP whitelist",
      "Pick a country when replacing IPs",
    ],
    kategori: {
      datacenter: {
        ringkasan: "High speed at the lowest price per IP. The go-to choice when you need many IPs at once.",
        cocokUntuk: ["Many accounts at once", "High speed", "Lowest cost per IP"],
      },
      residential: {
        ringkasan: "IPs from real home networks, so you look like an ordinary user. Ideal for strict sites.",
        cocokUntuk: ["Strict sites", "Looks like a home user", "Up to 100 IPs"],
      },
    },
    rotatingJudul: "API",
    rotatingJudulAwal: "Rotating",
    rotatingIsi:
      "One API key that hands you a fresh proxy from our shared pool on every call. Sold by duration, so there is no GB counter to watch. Fair use applies — see the FAQ.",
    rotatingBadge: ["No GB counter", "Pick a country", "Instant API key"],
    poolBersama: "Shared pool",
    poolSuffix: "pool",
  },

  cariPesanan: {
    label: "Order number",
    placeholder: "e.g. 240913ABCD1234",
    tombol: "Check order",
    sedangCek: "Checking…",
    wajibIsi: "Order number is required",
    kosong: "Enter your order number.",
    gagalKoneksi: "Can't connect",
    gagalKoneksiIsi: "Check your internet connection and try again.",
  },

  merek: {
    cepat: "Fast",
    aman: "Secure",
    terpercaya: "Trusted",
  },

  akun: {
    kembali: "← Home",
    eyebrow: "My account",
    judul: "Your",
    aksen: "orders",
    keluar: "Log out",

    masuk: {
      meta: "Log In",
      judul: "Log in to your",
      aksen: "account",
      ringkas: "Use the WhatsApp number you registered with to see all your orders in one place.",
    },
    daftar: {
      meta: "Create Account",
      judul: "Create an",
      aksen: "account",
      ringkas:
        "One account for all your orders. Your WhatsApp number is used to log in and to reach you when an order is close to expiring.",
    },
    klaim: {
      meta: "Claim Order",
      judul: "Claim an",
      aksen: "order",
      ringkasDenganNomor: "Enter the claim code for order {pesanan}. We send the code to you on WhatsApp.",
      ringkas: "Enter the claim code we send you on WhatsApp. One code for one order.",
      belumPunyaJudul: "Don't have a code?",
      belumPunyaIsi:
        "Ask us on WhatsApp and include your order number. The code is valid for 7 days and can only be used once.",
      mintaKode: "Request a claim code",
      kembaliKePesanan: "Back to my orders",
    },

    form: {
      noWa: "WhatsApp number",
      noWaBantuan: "You can write it as 0812…, +62812…, or 62812… — it's all the same.",
      nama: "Name",
      password: "Password",
      passwordMinimal: "At least 8 characters.",
      ulangiPassword: "Repeat password",
      kodeKlaim: "Claim code from the admin",
      tombolMasuk: "Log in",
      tombolDaftar: "Create account",
      tombolKlaim: "Add order",
      lupaPassword: "Forgot your password? Contact the admin on WhatsApp.",
      sudahPunyaAkun: "Already have an account?",
      masukDiSini: "Log in here",
      belumPunyaAkun: "Don't have an account yet?",
      daftarDulu: "Sign up first",
    },
  },

  pesanan: {
    meta: "My Orders",
    status: { aktif: "Active", akanExpired: "Expiring soon", expired: "Expired", nonaktif: "Inactive" },
    invoiceJudul: "Your",
    invoiceAksen: "invoices",
    invoiceRingkas: "Orders appear below once we've checked the payment — usually within 2 hours.",
    buka: "Open →",
    beliPaket: "+ Buy a plan",
    pesanPaket: "Order a plan",
    klaimPesanan: "Claim order",
    belumAdaJudul: "No",
    belumAdaAksen: "orders",
    belumAdaCheckout:
      "Pick a plan and pay by QRIS or bank transfer — or, if you already ordered elsewhere, enter the claim code we gave you.",
    belumAdaWa:
      "Message us on WhatsApp to order a plan — or, if you already ordered, enter the claim code we gave you.",
    lihatPaket: "Browse plans",
    pesanLewatWa: "Order on WhatsApp",
    klaimDenganKode: "Claim an order with a code",
    mintaKode: "Request a code from us",
    jumlahSatu: "{n} orders in this account. Click one to see its proxy list, bandwidth, and settings.",
    bukaDashboard: "Open dashboard →",
    halamanDitutup: "This order page is now closed",
    perpanjang: "Renew",
    aktifSampai: "Active until {tanggal} · {hari} days left",
    berakhir: "Ended {tanggal}",
    renewalSuffix: " (renewal)",
  },

  beli: {
    meta: "Buy a plan",
    eyebrow: "Checkout",
    judul: "Pick a",
    aksen: "plan",
    ringkas:
      "Pay by QRIS or bank transfer. We check every payment by hand, so your proxies are usually ready within 2 hours.",
    invoiceBerjalan: "Open invoices",
    kembaliKePesanan: "← My orders",
  },

  invoiceStatus: {
    menungguBayar: "Awaiting payment",
    menungguVerifikasi: "Checking payment",
    disetujui: "Completed",
    ditolak: "Rejected",
    kedaluwarsa: "Expired",
    dibatalkan: "Canceled",
  },

  invoice: {
    meta: "Invoice",
    judulHalaman: "Your",
    aksenHalaman: "invoice",
    transferPersis: "Transfer exactly",
    nominalInvoice: "Invoice amount",
    salinNominal: "Amount",
    setaraUsd: "≈{usd} — billed in Indonesian rupiah, so send the rupiah amount above.",
    peringatanAwal: "Send the amount",
    peringatanTebal: "exactly",
    peringatanAkhir:
      ", including the last 3 digits ({kode}). That is how we recognise your payment — a rounded amount can't be matched automatically.",
    paket: "Plan",
    durasi: "Duration",
    hargaPaket: "Plan price",
    kodeUnik: "Unique code",
    sisaWaktu: "{waktu} left to pay",
    bayarDengan: "Pay with",
    nomorRekening: "Account number",
    atasNama: "Account name",
    sudahTransfer: "I've sent the payment",
    sudahTransferBantuan: "Press this only after the transfer has gone through. We'll be notified straight away.",
    batalkan: "Cancel this invoice",
    langkahJudul: "What happens",
    langkahAksen: "next",
    langkah: [
      { judul: "Confirmation received", detail: "1–3 minutes" },
      { judul: "We check the payment", detail: "by hand, no payment gateway" },
      { judul: "Proxies activated", detail: "usually within 0–2 hours" },
    ],
    catatanManual:
      "We check payments by hand, so nothing is confirmed automatically. You'll see the order appear in your account page once it's done.",
    lunasJudul: "Payment confirmed",
    lunasIsi: "Your order is active. Open it from your account page.",
    ditolakJudul: "Invoice rejected",
    ditolakBawaan: "Please contact us on WhatsApp.",
    kedaluwarsaJudul: "Invoice expired",
    kedaluwarsaIsi:
      "This invoice is past its 24-hour window, so the amount is no longer reserved. Create a new one — or message us if you already sent the money.",
    gagalSalin: "Could not copy — please copy it by hand",
  },

  katalog: {
    judulCheckout: "Checkout",
    judulPerpanjang: "Renew",
    aksenPerpanjang: "order",
    beli: "Buy",
    batal: "Cancel",
    buatInvoice: "Create invoice",
    perpanjangJudul: "Renew an",
    perpanjangAksen: "existing order",
    perpanjangRingkas: "Renewing extends the same order — you keep the same IPs, API key, and dashboard.",
    perpanjangTombol: "Renew →",
    bukaInvoice: "Open invoice {no}",
    aktifSampai: "Active until {tanggal}",
    rotatingJudul: "Rotating",
    rotatingAksen: "API",
    rotatingRingkas:
      "One API key that hands you a fresh proxy from our shared pool on every call. Sold by duration, so there is no GB counter to watch. Fair use applies — see the FAQ.",
    poolLabel: "pool",
    proxiesSuffix: "proxies",
    paketLabel: "Plan",
    paketBantuan: "Pre-selected from your current order. Change it if you want a different size.",
    perpanjangCatatan: "Renewing order {no} — we add {durasi} to its current expiry date.",
    rotatingRingkasPaket: " · shared pool, one API key",
    paketSuffix: " plan",
    metodeBayar: "Payment method",
    catatanLabel: "Note for us (optional)",
    catatanPlaceholder: "e.g. a city, or anything else we should know",
    infoNominal:
      "We'll show you an exact amount to transfer, down to the last 3 digits — that is how we match your payment.",

    lokasiJudul: "Location",
    lokasiPreferensi: "(preferred)",
    lokasiAlokasi: "({jumlah} IP to allocate)",
    lokasiBersihkan: "Clear",
    lokasiAcak: "Random — let us pick the best available",
    lokasiSemuaTeralokasi: "All {jumlah} IPs allocated.",
    lokasiSisa: "{sisa} of {jumlah} IPs left to allocate.",
    lokasiKelebihan: "{lebih} IPs too many — reduce somewhere.",
    lokasiTambah: "Add",
    lokasiHapus: "Remove",
    lokasiJumlahAria: "IPs in {negara}",
    lokasiCatatanRotating:
      "You can still request any country per API call — this just tells us which ones to keep stocked for you.",
  },

  seo: {
    lihatHarga: "See pricing",

    datacenter: {
      metaTitle: "Datacenter Proxies — Fast & Affordable",
      metaDesc:
        "Buy fast datacenter proxies from $4. 50–1,000 IPs, same-day activation, self-service dashboard to replace IPs and manage your whitelist. Ideal for multi-accounting and high-volume automation.",
      badge: "Datacenter",
      judul: "Datacenter",
      aksen: "proxies",
      ringkasTambahan:
        " High speed, the lowest price per IP, and same-day activation — the go-to choice when you need many IPs at once for multi-accounting or automation.",
      gunaUntuk: [
        { judul: "Many accounts at once", isi: "A cheap per-IP price point makes it easy to run a large pool of accounts in parallel." },
        { judul: "High-volume automation", isi: "Low latency and high throughput for scraping, checkers, and bots that need speed." },
        { judul: "Bulk IP needs", isi: "Order 50 to 1,000 IPs in a single plan and manage them all from one dashboard." },
      ],
      hargaJudul: "Datacenter proxy pricing",
      hargaRingkas:
        "Prices in USD (IDR also listed). Every plan includes the full dashboard, IP replace quota, and whitelist management.",
      lintasAwal: "Need residential IPs instead?",
      lintasTautan: "See residential proxies",
    },

    residential: {
      metaTitle: "Residential Proxies — Real Home IPs",
      metaDesc:
        "Buy residential proxies with IPs from real home networks. Same-day activation, country selection when replacing IPs, and a self-service dashboard. Ideal for strict sites.",
      badge: "Residential",
      judul: "Residential",
      aksen: "proxies",
      ringkasTambahan:
        " IPs from real home networks make you look like an ordinary user — the right pick for sites that reject datacenter ranges.",
      gunaUntuk: [
        { judul: "Strict sites", isi: "Home-network IPs pass on sites that block datacenter ranges." },
        { judul: "Looks like a real user", isi: "Traffic appears to come from an ordinary residential connection." },
        { judul: "Country targeting", isi: "Pick a destination country when you replace IPs, while stock lasts." },
      ],
      hargaJudul: "Residential proxy pricing",
      hargaRingkas:
        "Prices in USD (IDR also listed). Every plan includes the full dashboard, IP replace quota, and whitelist management.",
      lintasAwal: "Need cheaper datacenter IPs?",
      lintasTautan: "See datacenter proxies",
    },

    rotating: {
      metaTitle: "Rotating Proxy API — Random IPs from a Pool",
      metaDesc:
        "One API endpoint and a secret key to pull random proxies from our pool. Sold by duration: 7, 14 or 30 days, with no GB metering. Choose the count and country straight from your script.",
      badge: "For automation",
      judul: "Rotating proxy",
      aksen: "API",
      ringkas:
        "One API endpoint and a secret key to pull random proxies from our pool — choose the count and country straight from your script. Sold by duration: 7, 14 or 30 days, with no GB metering.",
      kapanBergantiTebal: "You decide when the IP changes.",
      kapanBerganti:
        " Every call to the endpoint hands you a fresh random proxy — up to {maks} at a time, up to {rate} calls per minute. The proxy you receive keeps its IP for as long as you use it; call again whenever you want a different one. This is a proxy-list API, not a backconnect gateway that changes IP on every request.",
      fitur: [
        { judul: "One endpoint, one key", isi: "Pull proxies on demand from a single API endpoint secured by your secret key." },
        { judul: "Choose count & country", isi: "Request how many proxies you need and from which country, right in your call." },
        { judul: "No GB metering", isi: "Limited by plan validity and requests per minute — not by gigabytes used." },
      ],
      caraKerjaJudul: "How it works",
      caraKerja: [
        "1. We set up your pool and issue an API endpoint plus a secret key.",
        "2. Your script calls the endpoint with the count and country you want.",
        "3. You receive ready-to-use proxies — call again whenever you want different IPs, up to your per-minute limit.",
      ],
    },
  },

  dasbor: {
    meta: "Order Details",
    nomorPesanan: "Order number",
    cekPesananLain: "Check another order",
    semuaPesananSaya: "All my orders",
    masaBerlaku: "Validity",
    periode: "Period",
    berlakuSampai: "Valid until",
    habis: "Expired",
    perpanjang: "Renew",
    tanpaBiaya: "No service fee, same price.",

    status: { aktif: "Active", akanHabis: "Expiring soon", habis: "Expired" },

    kedaluwarsa: {
      judulHabis: "Your plan",
      aksenHabis: "has expired",
      judulSegera: "Your proxy expires",
      aksenSegera: "in {hari} days",
      isiHabis:
        "Your proxy has been expired since {tanggal}. Renew now to use it again. This page stays available until {batas}.",
      isiSegera: "Your plan ends on {tanggal}. Renew before it expires so your proxy stays connected.",
      tombol: "Renew now",
      catatan: "Renew directly with the admin: no service fee, same price.",
    },

    paketLain: {
      judul: "Need",
      aksen: "another plan?",
      isi: "Add IPs, increase bandwidth, or try a different proxy type.",
      mulaiDari: "from",
      lihatSemua: "See all plans",
    },

    gagal: {
      terlaluSering: "Too many attempts",
      pesananLain: "Order belongs to another account",
      pesananLainIsi:
        "This order number is already linked to another customer's account. If this is your order, contact the admin on WhatsApp.",
      adaMasalah: "Something went wrong",
      adaMasalahIsi: "The server is having trouble. Please reload the page in a moment.",
    },

    proxy: {
      judul: "Proxy",
      aksen: "list",
      memuat: "Loading proxy list…",
      kosong: "No proxies on this order yet.",
      muatUlang: "Reload",
      muatUlangAria: "Reload proxy list",
      salin: "Copy proxy",
      tersalin: "Proxy copied",
      gagalSalin: "Failed to copy. Please copy it manually.",
      gagalSalinTxt: "Failed to copy. Use the Download .txt button.",
      negara: "Country",
      kataSandi: "Password",
      aksi: "Action",
      sebelumnya: "Previous",
      berikutnya: "Next",
      halamanAria: "Proxy pagination",
      sedangDiganti: "An IP replace is still processing. The list will update automatically.",
      kuotaHabis: "Replace quota used up, contact the admin",
      perpanjangUntukPakai: "Renew your order to use the proxy, replace IPs, and whitelist again.",
      lihatPerpanjangan: "See renewal options",
    },

    bandwidth: {
      judul: "Bandwidth",
      sisa: "Remaining",
      dari: "of",
      takTerbatas: "Unlimited",
      segar: "Bandwidth data updated",
      muatUlang: "Refresh",
      muatUlangAria: "Refresh bandwidth",
      memuat: "Loading bandwidth data",
      sehat: "Healthy",
      menipis: "Running low",
      kritis: "Critical",
      hampirHabis: "Bandwidth is almost used up. Contact the admin to add more quota.",
      takTersedia: "Bandwidth data is currently unavailable",
      cobaLagi: "Please press Refresh again in a moment.",
    },

    whitelist: {
      judul: "Whitelist",
      ringkas: "Use the proxy without a username & password from networks with these IPs.",
      kosong: "No IPs in the whitelist yet.",
      muatUlangAria: "Reload whitelist",
      contoh: "Example: 103.10.20.30",
      formatSalah: "Invalid IP format. A correct example: 103.10.20.30",
      ipTerisi: "Your current IP has been filled in",
      ipGagalDeteksi: "Your IP could not be detected. Please enter it manually.",
    },

    ganti: {
      judul: "Replace IP",
      tombol: "Replace",
      ipProxy: "Proxy IP",
      negaraAcak: "Random (any country)",
      memuatNegara: "Loading country list…",
      peringatan: "The old IP can no longer be used once replaced.",
      prosesLama: "This can take up to ±30 seconds. Do not close the page.",
      mengirim: "Sending request…",
      mencari: "Finding a replacement IP…",
      hampirSelesai: "Almost done, please wait…",
      sedangProses: "Processing",
    },

    kredensial: {
      judul: "User & Password",
      ubah: "Change",
      simpan: "Save",
      menyimpan: "Saving",
      acakUser: "Randomize username",
      acakPassword: "Randomize password",
      aturan: "Use 8-32 letters and numbers only, with no spaces or symbols.",
      belumBerubah: "Nothing has changed yet. Edit the username or password first.",
      berhasil: "Proxy username & password changed successfully",
      tersalin: "Username & password copied",
      gagalSalin: "Failed to copy.",
      peringatan: "Connections using the old credentials will be rejected immediately.",
    },

    rotating: {
      judulEndpoint: "Endpoint &",
      aksenEndpoint: "API key",
      alamat: "Endpoint address",
      kunci: "API Key",
      panggil: "Call this address to get a random proxy from the pool.",
      contohPerintah: "Example command",
      balasan: "The response is plain text, one proxy per line. Use those proxies as usual:",
      pool: "Pool",
      poolRingkas: "{jumlah} active proxies · limit {rate} requests/minute",
      poolDiperbarui: "Pool data updated",
      negaraTersedia: "Available countries",
      contohPakai: "Usage example",
      opsiParameter: "Parameter options",
      parameter: "Parameter",
      nilai: "Value",
      keterangan: "Description",
      descCount: "Number of proxies per request. Default 1.",
      descCountry: "Pick a specific country. Leave empty for random.",
      descFormat: "Output format. Default ip:port:user:pass.",
      rahasia: "Keep your API key secret.",
      belumAdaNegara: "No country data yet.",
      kunciMati: "The API key is disabled because the plan has expired. Renew to activate it again.",
      gagalSalin: "Failed to copy. Please copy it manually.",
    },
  },
};
