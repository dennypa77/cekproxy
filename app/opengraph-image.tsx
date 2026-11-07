import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteHost } from "@/lib/site";

export const alt = "dmproxy — datacenter & residential proxies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Logo dibaca dari disk saat gambar dirender (bukan <img src="/logo.png">):
 * satu-satunya cara yang pasti jalan, karena saat build belum ada URL publik.
 */
const LOGO = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/logo.png")).toString("base64")}`;

/** Preview card shown when a link is shared on WhatsApp / social. */
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
          background: "#0a0e14",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} width={104} height={104} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, color: "#e8eef6" }}>DMPROXY</div>
            <div style={{ fontSize: 26, color: "#93a3b8" }}>{siteHost()}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: "#e8eef6" }}>FAST PROXIES</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.1, color: "#2e95ff" }}>FOR ANY JOB</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#06101c",
              background: "#e8eef6",
              borderRadius: 999,
              padding: "14px 32px",
            }}
          >
            Datacenter · Residential · Rotating API
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#93a3b8" }}>Same-day activation</div>
        </div>
      </div>
    ),
    size,
  );
}
