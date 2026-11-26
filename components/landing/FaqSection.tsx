import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { isiVar } from "@/lib/i18n";
import { kamus, type Kamus } from "@/lib/kamus";
import { waHelpLink } from "@/lib/links";
import { MASA_AKTIF_HARI, ROTATING_FAIR_USE_GB } from "@/lib/pricing";

/**
 * Daftar FAQ sebagai teks biasa, supaya isi yang sama dipakai tampilan DAN
 * JSON-LD FAQPage. Dibuat sebagai fungsi (bukan konstanta modul) karena
 * isinya kini bergantung pada bahasa yang sedang dibuka.
 */
export function faqItems(k: Kamus, checkout: boolean): { q: string; a: string }[] {
  const f = k.faq.item;
  return [
    { q: f.bedaJenis.t, a: f.bedaJenis.j },
    { q: f.masaAktif.t, a: isiVar(f.masaAktif.j, { hari: MASA_AKTIF_HARI }) },
    { q: f.caraPakai.t, a: f.caraPakai.j },
    { q: f.gantiIp.t, a: f.gantiIp.j },
    { q: f.pilihNegara.t, a: f.pilihNegara.j },
    { q: f.bandwidthHabis.t, a: f.bandwidthHabis.j },
    {
      q: f.adaRotating.t,
      a: checkout ? isiVar(f.adaRotating.jCheckout, { gb: ROTATING_FAIR_USE_GB }) : f.adaRotating.jWa,
    },
    { q: f.batasWajar.t, a: isiVar(f.batasWajar.j, { gb: ROTATING_FAIR_USE_GB }) },
    { q: f.caraBayar.t, a: checkout ? f.caraBayar.jCheckout : f.caraBayar.jWa },
    { q: f.kenapaLebihMurah.t, a: f.kenapaLebihMurah.j },
  ];
}

export async function FaqSection() {
  const k = await kamus();
  const items = faqItems(k, checkoutEnabled());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 py-14 sm:py-20">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            {k.faq.judul} <span className="text-brand">{k.faq.judulAksen}</span>
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">{k.faq.masihBingung}</p>
        </div>

        <div className="mt-8 space-y-3">
          {items.map((item) => (
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
            <WhatsAppIcon className="size-4" /> {k.umum.tanyaKami}
          </a>
        </div>
      </div>
    </section>
  );
}
