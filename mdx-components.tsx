import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes } from "react";
import Link from "next/link";

/**
 * Komponen global untuk semua file MDX (artikel blog). Dipetakan ke token
 * desain dmproxy (tema datacenter gelap) supaya artikel seragam dengan situs,
 * tanpa perlu plugin typography Tailwind. File ini WAJIB ada untuk @next/mdx
 * dengan App Router.
 */
function MdxLink({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const internal = href.startsWith("/") || href.startsWith("#");
  const className = "font-semibold text-brand underline underline-offset-2 hover:text-brand-deep";
  if (internal) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}

const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="mt-12 mb-4 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 font-display text-xl font-bold tracking-tight text-ink">{children}</h3>
  ),
  h4: ({ children }) => <h4 className="mt-6 mb-2 text-base font-bold text-ink">{children}</h4>,
  p: ({ children }) => <p className="my-4 text-[15px] leading-7 text-ink/85 sm:text-base sm:leading-8">{children}</p>,
  a: MdxLink,
  ul: ({ children }) => <ul className="my-4 ml-5 list-disc space-y-2 text-[15px] leading-7 text-ink/85 sm:text-base">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 ml-5 list-decimal space-y-2 text-[15px] leading-7 text-ink/85 sm:text-base">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-brand">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-2xl border-2 border-brand/40 bg-surface-2 px-5 py-1 text-ink/90">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-t-2 border-line" />,
  strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-brand">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-2xl border-2 border-ink bg-surface-2 p-4 font-mono text-sm text-ink/90">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-2xl border-2 border-ink">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b-2 border-ink bg-surface-2 px-4 py-2.5 font-display text-xs font-extrabold tracking-wide text-ink uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-line px-4 py-2.5 align-top text-ink/85">{children}</td>,
};

export function useMDXComponents(existing: MDXComponents = {}): MDXComponents {
  return { ...existing, ...components };
}
