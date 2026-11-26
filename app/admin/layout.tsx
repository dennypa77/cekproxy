import type { Metadata, Viewport } from "next";
import { Geist, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin · dmproxy", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/**
 * Root layout khusus panel admin.
 *
 * Panel ini sengaja BERADA DI LUAR segmen [lang]: hanya pemilik yang
 * memakainya, jadi tidak perlu diterjemahkan — dan membiarkannya di luar
 * berarti [lang] bisa menjadi root param, sehingga halaman customer tidak
 * perlu mengoper bahasa lewat props ke setiap komponen.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${poppins.variable}`}>
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
