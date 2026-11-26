import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Geist, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { KamusProvider } from "@/components/KamusProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { BAHASA, isBahasa, jalur, KODE_HREFLANG, type Bahasa } from "@/lib/i18n";
import { kamusUntuk } from "@/lib/kamus";
import { siteUrl } from "@/lib/site";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-poppins", display: "swap" });

const DESCRIPTION =
  "Buy fast datacenter & residential proxies. Same-day activation, self-service dashboard to check bandwidth, replace IPs, and manage your IP whitelist.";

const JUDUL: Record<Bahasa, string> = {
  id: "dmproxy — Proxy Datacenter & Residential",
  en: "dmproxy — Datacenter & Residential Proxies",
};

const KETERANGAN: Record<Bahasa, string> = {
  id: "Beli proxy datacenter & residential yang cepat. Aktif di hari yang sama, dengan dashboard sendiri untuk cek bandwidth, ganti IP, dan atur whitelist.",
  en: DESCRIPTION,
};

/**
 * hreflang menghubungkan kedua bahasa supaya Google tahu keduanya halaman
 * yang sama, bukan konten duplikat. Tanpa ini, versi Indonesia dan Inggris
 * bisa saling menggerus peringkat.
 */
export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  const bahasa: Bahasa = isBahasa(lang) ? lang : "id";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: JUDUL[bahasa], template: "%s · dmproxy" },
    description: KETERANGAN[bahasa],
    applicationName: "dmproxy",
    alternates: {
      canonical: jalur(bahasa, "/"),
      languages: {
        ...Object.fromEntries(BAHASA.map((b) => [KODE_HREFLANG[b], jalur(b, "/")])),
        "x-default": jalur("id", "/"),
      },
    },
    openGraph: {
      type: "website",
      locale: bahasa === "id" ? "id_ID" : "en_US",
      url: jalur(bahasa, "/"),
      siteName: "dmproxy",
      title: JUDUL[bahasa],
      description: KETERANGAN[bahasa],
    },
    twitter: { card: "summary_large_image", title: "dmproxy", description: KETERANGAN[bahasa] },
  };
}

// Structured data for the site/brand, shown on every page.
function orgJsonLd(bahasa: Bahasa) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "dmproxy",
    url: siteUrl(),
    // icon.svg sudah tidak ada sejak logo diganti PNG; tautannya 404.
    logo: `${siteUrl()}/icon.png`,
    description: KETERANGAN[bahasa],
    sameAs: [] as string[],
  };
}

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "dmproxy",
  url: siteUrl(),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/** Kedua bahasa dibangkitkan saat build; selain itu 404. */
export function generateStaticParams() {
  return BAHASA.map((lang) => ({ lang }));
}

export default async function RootLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  // Alamat seperti /xx/apa-pun tidak boleh diam-diam dianggap Indonesia.
  if (!isBahasa(lang)) notFound();
  const { children } = props;

  return (
    <html lang={KODE_HREFLANG[lang]} className={`${geist.variable} ${poppins.variable}`}>
      <body className="min-h-dvh">
        <JsonLd data={[orgJsonLd(lang), WEBSITE_JSON_LD]} />
        <KamusProvider kamus={kamusUntuk(lang)} bahasa={lang}>
          {children}
        </KamusProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 3500,
            classNames: { toast: "rounded-2xl! border-2! border-ink! font-sans! font-semibold!" },
          }}
        />
      </body>
    </html>
  );
}
