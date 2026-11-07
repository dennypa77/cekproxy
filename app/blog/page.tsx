import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui";
import { allPosts, formatPostDate } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

const TITLE = "Proxy Guides & Tutorials | dmproxy Blog";
const DESCRIPTION =
  "Guides and tutorials on datacenter, residential, and rotating proxies — how to choose them, set them up, and use them for multi-accounting, scraping, and automation.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/blog" },
};

export default function BlogIndexPage() {
  const posts = allPosts();

  const BLOG_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "dmproxy Blog",
    description: DESCRIPTION,
    url: `${siteUrl()}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      dateModified: p.updated ?? p.date,
      url: `${siteUrl()}/blog/${p.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={BLOG_JSON_LD} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone="blue">Blog</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              Proxy guides &amp; <span className="text-brand">tutorials</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">
              Practical write-ups on choosing, setting up, and using proxies — from datacenter vs residential to
              rotating APIs and antidetect browsers.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <ul className="grid gap-5 sm:grid-cols-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col rounded-3xl border-2 border-ink bg-surface p-6 transition-colors hover:border-brand"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Badge tone="gray">{post.category}</Badge>
                      <span>{formatPostDate(post.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readingMinutes} min read</span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-extrabold tracking-tight text-ink group-hover:text-brand sm:text-xl">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted">{post.description}</p>
                    <span className="mt-4 text-sm font-bold text-brand">Read article →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
