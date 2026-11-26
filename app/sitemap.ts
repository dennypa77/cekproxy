import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";
import { BAHASA, jalur } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

/**
 * Daftar halaman publik yang boleh diindeks. Artikel blog ditambahkan otomatis
 * dari registry (lib/blog.ts). Halaman customer/admin sengaja tidak dimasukkan
 * (lihat app/robots.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/proxy-datacenter", changeFrequency: "weekly", priority: 0.9 },
    { path: "/proxy-residential", changeFrequency: "weekly", priority: 0.9 },
    { path: "/proxy-rotating-api", changeFrequency: "weekly", priority: 0.8 },
    { path: "/tools/what-is-my-ip", changeFrequency: "monthly", priority: 0.6 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  ];

  // Kedua bahasa didaftarkan. Tanpa ini Google hanya menemukan versi
  // Indonesia, dan halaman /en tidak akan pernah terindeks.
  const staticEntries: MetadataRoute.Sitemap = routes.flatMap((r) =>
    BAHASA.map((bahasa) => ({
      url: `${base}${jalur(bahasa, r.path)}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: bahasa === "id" ? r.priority : Math.max(0.1, r.priority - 0.1),
    })),
  );

  const postEntries: MetadataRoute.Sitemap = allPosts().flatMap((post) =>
    BAHASA.map((bahasa) => ({
      url: `${base}${jalur(bahasa, `/blog/${post.slug}`)}`,
      lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: bahasa === "id" ? 0.6 : 0.5,
    })),
  );

  return [...staticEntries, ...postEntries];
}
