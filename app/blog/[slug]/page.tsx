import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { allPosts, formatPostDate, getPost } from "@/lib/blog";
import { waOrderGeneralLink } from "@/lib/links";
import { siteUrl } from "@/lib/site";

// Semua artikel di-prerender; slug di luar daftar → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { default: Article } = await import(`@/content/blog/${slug}.mdx`);

  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl()}/blog/${post.slug}` },
    author: { "@type": "Organization", name: "dmproxy", url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: "dmproxy",
      logo: { "@type": "ImageObject", url: `${siteUrl()}/icon.svg` },
    },
  };

  return (
    <>
      <JsonLd data={JSON_LD} />
      <SiteHeader />

      <main>
        <article>
          <header className="border-b-2 border-line bg-surface">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
              <Link href="/blog" className="text-sm font-bold text-brand hover:underline">
                ← Back to blog
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone="blue">{post.category}</Badge>
                <span>{formatPostDate(post.updated ?? post.date)}</span>
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-base text-muted">{post.description}</p>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
            <Article />

            <aside className="mt-12 rounded-3xl border-2 border-brand/50 bg-surface-2 p-6 sm:p-8">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-ink uppercase">
                Need proxies that just work?
              </h2>
              <p className="mt-2 text-sm text-muted sm:text-base">
                dmproxy offers datacenter and residential proxies with a self-service dashboard, IP replacement, and
                same-day activation. Pick a plan or ask us what fits your use case.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/proxy-datacenter" className={buttonClass("primary", "md")}>
                  See datacenter plans
                </Link>
                <Link href="/proxy-residential" className={buttonClass("secondary", "md")}>
                  See residential plans
                </Link>
                <a
                  href={waOrderGeneralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary", "md")}
                >
                  <WhatsAppIcon className="size-4" /> Ask us
                </a>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
