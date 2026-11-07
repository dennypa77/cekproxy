import type { Metadata, Viewport } from "next";
import { Geist, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-poppins", display: "swap" });

const DESCRIPTION =
  "Buy fast datacenter & residential proxies. Same-day activation, self-service dashboard to check bandwidth, replace IPs, and manage your IP whitelist.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "dmproxy — Datacenter & Residential Proxies", template: "%s · dmproxy" },
  description: DESCRIPTION,
  applicationName: "dmproxy",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "dmproxy",
    title: "dmproxy — Datacenter & Residential Proxies",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "dmproxy", description: DESCRIPTION },
};

// Structured data for the site/brand, shown on every page.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "dmproxy",
  url: siteUrl(),
  logo: `${siteUrl()}/icon.svg`,
  description: DESCRIPTION,
  sameAs: [] as string[],
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${poppins.variable}`}>
      <body className="min-h-dvh">
        <JsonLd data={[ORG_JSON_LD, WEBSITE_JSON_LD]} />
        {children}
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
