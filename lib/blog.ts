/**
 * Daftar artikel blog (sumber tunggal untuk metadata, halaman index, dan
 * sitemap). Isi/badan artikel ada di `content/blog/<slug>.mdx`; file ini hanya
 * menyimpan metadatanya supaya type-safe dan tidak perlu parser frontmatter.
 *
 * Menambah artikel: buat `content/blog/<slug>.mdx`, lalu tambahkan satu entri
 * di sini dengan slug yang sama.
 */
export type BlogPost = {
  slug: string;
  title: string;
  /** Dipakai untuk meta description + ringkasan di kartu index. */
  description: string;
  /** Tanggal terbit (ISO, YYYY-MM-DD). */
  date: string;
  /** Tanggal update terakhir (ISO). Kosong = sama dengan `date`. */
  updated?: string;
  /** Perkiraan waktu baca dalam menit. */
  readingMinutes: number;
  /** Label kategori singkat untuk badge. */
  category: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "datacenter-vs-residential-proxies",
    title: "Datacenter vs Residential Proxies: Which One Do You Need?",
    description:
      "Datacenter proxies are fast and cheap; residential proxies look like real home users. Here's how they differ and how to pick the right one for your use case.",
    date: "2026-11-07",
    readingMinutes: 7,
    category: "Compare",
  },
  {
    slug: "what-is-a-rotating-proxy-api",
    title: "What Is a Rotating Proxy API and How to Use One",
    description:
      "A rotating proxy API gives your script fresh IPs on demand from one endpoint. Learn how rotation works, when to use it, and how to call it from your code.",
    date: "2026-11-06",
    readingMinutes: 6,
    category: "Guide",
  },
  {
    slug: "how-to-set-up-proxies-in-antidetect-browser",
    title: "How to Set Up Proxies in an Antidetect Browser (AdsPower, GoLogin, Dolphin Anty)",
    description:
      "A step-by-step guide to adding HTTP/SOCKS5 proxies to AdsPower, GoLogin, and Dolphin Anty, testing them, and avoiding the mistakes that get profiles flagged.",
    date: "2026-11-05",
    readingMinutes: 8,
    category: "Tutorial",
  },
];

/** Artikel terbaru lebih dulu. */
export function allPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Format tanggal yang ramah pembaca internasional, mis. "November 7, 2026". */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
