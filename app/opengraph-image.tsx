import { ImageResponse } from "next/og";
import { siteHost } from "@/lib/site";

export const alt = "Cek Proxy DM Digital";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gambar preview saat link dibagikan di WhatsApp / chat Shopee. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f5f7",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 32,
              background: "#111111",
            }}
          >
            <svg width="76" height="76" viewBox="0 0 100 100" fill="none" stroke="#ffffff">
              <circle cx="50" cy="50" r="41" strokeWidth="6" />
              <path d="M28 32 L50 65 L72 32 V72" strokeWidth="10" strokeLinejoin="miter" />
              <path d="M28 32 V60" strokeWidth="10" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, color: "#111111" }}>DM DIGITAL</div>
            <div style={{ fontSize: 26, color: "#5b6270" }}>{siteHost()}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1, color: "#111111" }}>CEK STATUS</div>
          <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1.1, color: "#1e8bff" }}>PROXY</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              background: "#111111",
              borderRadius: 999,
              padding: "14px 32px",
            }}
          >
            Bandwidth · Daftar IP · Replace · Whitelist
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#5b6270" }}>Cukup pakai nomor pesanan Shopee</div>
        </div>
      </div>
    ),
    size,
  );
}
