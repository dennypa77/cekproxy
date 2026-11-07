import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";
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

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const postEntries: MetadataRoute.Sitemap = allPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
