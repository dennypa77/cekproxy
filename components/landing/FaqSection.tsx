import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { waHelpLink } from "@/lib/links";
import { MASA_AKTIF_HARI } from "@/lib/pricing";

const FAQ: { tanya: string; jawab: ReactNode }[] = [
  {
    tanya: "Apa bedanya proxy datacenter dan residential?",
    jawab: (
      <>
        Datacenter memakai IP milik pusat data: lebih cepat dan lebih murah per IP, cocok kalau Anda butuh banyak IP
        sekaligus. Residential memakai IP dari jaringan rumahan sehingga terlihat seperti pengguna biasa, lebih cocok
        untuk situs yang ketat. Jumlah IP-nya lebih sedikit dan harganya lebih tinggi per IP.
      </>
    ),
  },
  {
    tanya: "Berapa lama masa aktifnya?",
    jawab: (
      <>
        {MASA_AKTIF_HARI} hari sejak proxy diaktifkan. Sisa harinya bisa Anda lihat kapan saja di halaman{" "}
        <a href="#cek-pesanan" className="font-semibold text-brand-deep hover:underline">
          Cek Pesanan
        </a>
        . Mendekati habis, kami ingatkan lewat chat Shopee dan Anda bisa langsung perpanjang.
      </>
    ),
  },
  {
    tanya: "Bagaimana cara memakai proxinya?",
    jawab: (
      <>
        Setelah pesanan aktif, buka halaman Cek Pesanan dengan nomor pesanan Shopee Anda. Di sana ada daftar IP lengkap
        dengan port, username, dan password, bisa disalin satu per satu atau diunduh sebagai file .txt dalam tiga
        format. Tinggal dimasukkan ke browser antideteksi, aplikasi, atau tools yang Anda pakai.
      </>
    ),
  },
  {
    tanya: "Kalau ada IP yang mati atau terblokir, bisa diganti?",
    jawab: (
      <>
        Bisa. Setiap pesanan punya kuota ganti IP (replace) yang bisa dipakai sendiri lewat dashboard, tanpa menunggu
        admin. Saat mengganti, Anda juga boleh memilih negara tujuan selama stoknya tersedia. Kalau kuotanya habis,
        hubungi kami lewat WhatsApp.
      </>
    ),
  },
  {
    tanya: "Bisa pilih negara tertentu?",
    jawab: (
      <>
        Bisa, lewat menu ganti IP di dashboard. Pilihan negara mengikuti stok yang sedang tersedia, jadi daftarnya bisa
        berubah sewaktu-waktu. Kalau negara yang Anda butuhkan sedang kosong, kabari kami.
      </>
    ),
  },
  {
    tanya: "Bagaimana kalau bandwidth saya habis sebelum masa aktif berakhir?",
    jawab: (
      <>
        Pemakaian bandwidth terlihat di dashboard lengkap dengan sisa kuotanya. Kalau habis sebelum waktunya, Anda bisa
        membeli paket baru di Shopee atau menghubungi kami untuk menambah kuota.
      </>
    ),
  },
  {
    tanya: "Apakah ada paket rotating lewat API?",
    jawab: (
      <>
        Ada. Anda mendapat satu alamat API dan kunci rahasia untuk mengambil proxy acak dari pool kami, lengkap dengan
        pilihan jumlah dan negara. Harganya menyesuaikan kebutuhan, jadi silakan hubungi kami lewat WhatsApp.
      </>
    ),
  },
  {
    tanya: "Bagaimana cara pesan dan bayarnya?",
    jawab: (
      <>
        Paling cepat: klik <b>Pesan langsung</b> pada paket yang Anda mau, lalu admin membalas di WhatsApp dengan cara
        pembayarannya. Cara ini bebas biaya admin marketplace dan harganya sama persis dengan yang tertera di sini.
        Kalau lebih nyaman memakai perlindungan pembeli Shopee, pesanan lewat Shopee tetap kami layani dengan harga
        yang sama.
      </>
    ),
  },
  {
    tanya: "Kenapa pesan langsung lebih murah?",
    jawab: (
      <>
        Harga paketnya sama. Bedanya, pembelian lewat marketplace biasanya menambahkan biaya admin dan biaya layanan di
        sisi pembeli — itu yang hilang kalau Anda pesan langsung ke kami.
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            Pertanyaan <span className="text-brand">umum</span>
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Belum terjawab? Chat kami, biasanya dibalas pada jam kerja.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.tanya}
              className="group rounded-3xl border-2 border-ink bg-white p-4 open:bg-brand-softer sm:p-5"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-extrabold text-ink marker:hidden sm:text-lg">
                {item.tanya}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm leading-none font-extrabold transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.jawab}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            <WhatsAppIcon className="size-4" /> Tanya lewat WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
