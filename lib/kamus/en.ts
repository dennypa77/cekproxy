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
};
