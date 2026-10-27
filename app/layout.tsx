import type { Metadata, Viewport } from "next";
import { Geist, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-poppins", display: "swap" });

const DESCRIPTION =
  "Jual proxy datacenter & residential. Pesan langsung ke admin, bebas biaya admin, lengkap dengan dashboard cek bandwidth, ganti IP, dan IP whitelist.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "dmproxy — Jual Proxy Datacenter & Residential", template: "%s · dmproxy" },
  description: DESCRIPTION,
  applicationName: "dmproxy",
  // Kartu preview saat link dibagikan di WhatsApp / chat Shopee.
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "dmproxy",
    title: "dmproxy — Jual Proxy Datacenter & Residential",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "dmproxy", description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} ${poppins.variable}`}>
      <body className="min-h-dvh">
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
