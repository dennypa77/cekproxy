/**
 * Render structured data (JSON-LD) as a <script> tag.
 * `<` is escaped to its unicode form to avoid XSS via injected strings
 * (per Next.js guidance for JSON-LD).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
