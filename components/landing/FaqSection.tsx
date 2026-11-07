import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { waHelpLink } from "@/lib/links";
import { MASA_AKTIF_HARI } from "@/lib/pricing";

/** Plain-text FAQ so the same content powers both the UI and FAQPage JSON-LD. */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What's the difference between datacenter and residential proxies?",
    a: "Datacenter proxies use IPs from data centers: faster and cheaper per IP, ideal when you need many IPs at once. Residential proxies use IPs from real home networks, so you look like an ordinary user — a better fit for strict sites. They come in smaller counts and cost more per IP.",
  },
  {
    q: "How long is each plan active?",
    a: `${MASA_AKTIF_HARI} days from the moment your proxies are activated. You can check the remaining days anytime from your dashboard, and we'll remind you over WhatsApp as it nears expiry so you can renew in one tap.`,
  },
  {
    q: "How do I use the proxies?",
    a: "Once your order is active, open it with your order number. You'll get the full IP list with host, port, username and password — copy them one by one or download a .txt file in three formats. Just drop them into your antidetect browser, app, or any tool you use.",
  },
  {
    q: "Can I replace an IP that dies or gets blocked?",
    a: "Yes. Every order comes with a replace quota you can use yourself from the dashboard, no waiting on support. When replacing, you can also choose the destination country while stock lasts. If your quota runs out, message us on WhatsApp.",
  },
  {
    q: "Can I choose a specific country?",
    a: "Yes, from the replace menu in your dashboard. Available countries follow current stock, so the list can change. If the country you need is out of stock, let us know.",
  },
  {
    q: "What if my bandwidth runs out before the plan expires?",
    a: "Your bandwidth usage and remaining quota are shown in the dashboard. If it runs out early, you can order a new plan or message us to top up.",
  },
  {
    q: "Is there a rotating plan via API?",
    a: "Yes. You get a single API endpoint and a secret key to pull random proxies from our pool, with your choice of count and country. Pricing depends on your needs, so please reach out on WhatsApp.",
  },
  {
    q: "How do I order and pay?",
    a: "Create an account, press Order on the plan you want, and you'll get an invoice with an exact amount to transfer by QRIS, BCA or BRI. There's no payment gateway, so we check each transfer by hand — proxies are usually live within 2 hours. Prices shown are final, with no marketplace service fee added.",
  },
  {
    q: "Why is ordering directly cheaper?",
    a: "The package price is the same. The difference is that marketplaces usually add admin and service fees on the buyer's side — those disappear when you order directly from us.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-14 sm:py-20">
      <JsonLd data={FAQ_JSON_LD} />
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            Frequently asked <span className="text-brand">questions</span>
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Still unsure? Message us — we usually reply during working hours.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-3xl border-2 border-ink bg-surface p-4 open:bg-brand-softer sm:p-5"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-display text-base font-extrabold text-ink marker:hidden sm:text-lg">
                {item.q}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm leading-none font-extrabold transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            <WhatsAppIcon className="size-4" /> Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
