import Link from "next/link";
import DesignCard from "@/components/DesignCard";
import { getBestsellers, getCategories, getDesigns, getOffers, getPricing } from "@/lib/db";
import { formatPrice, fromPrice, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const d = t(lang);
  const [designs, cats, pricing, offers, best] = await Promise.all([getDesigns({ limit: 8 }), getCategories(), getPricing(), getOffers(), getBestsellers(4)]);
  const catName = (id: number | null) => {
    const c = cats.find((c) => c.id === id);
    return c ? (lang === "sq" ? c.name_sq : c.name_en) : null;
  };
  const minPrice = (c: CountryCode) => fromPrice(pricing, c);

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-16 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-[12px] sm:text-[13px] text-muted border border-line rounded-lg px-3 py-1.5">{d.hero_badge}</span>
          <h1 className="font-display mt-6 text-[44px] sm:text-[64px] leading-[1.02] font-bold">
            {d.hero_title_1}<br />{d.hero_title_2}
          </h1>
          <p className="mt-6 text-[17px] text-muted leading-relaxed max-w-md">{d.hero_sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={`/${lang}/create`} className="btn-dark h-14 px-7">{d.cta_customize} <span aria-hidden>→</span></Link>
            <Link href={`/${lang}/designs`} className="font-semibold px-3 hover:underline">{d.browse_designs}</Link>
            <Link href={`/${lang}/quiz`} className="font-semibold px-3 hover:underline">✨ {d.quiz}</Link>
          </div>
          <p className="mt-6 text-[13px] text-muted">
            {COUNTRIES.map((c, i) => (
              <span key={c.code}>{i > 0 && " · "}{lang === "sq" ? c.sq : c.en}: {d.from} {formatPrice(minPrice(c.code), c.code, lang)}</span>
            ))}
          </p>
        </div>
        <div>
          {/* Hero photo: replace public/hero.jpg to change it */}
          <img src="/hero.jpg" alt="DAXCASES" className="hero-img w-full h-auto mix-blend-multiply" />
        </div>
      </section>

      {/* OFERTA BOX */}
      {offers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <div className="rounded-3xl bg-ink text-white p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="font-display text-[32px] sm:text-[40px] font-bold">{d.offer_box}</h2><p className="text-white/70 mt-1">{d.offer_sub}</p></div>
              <Link href={`/${lang}/create`} className="btn-dark">{d.cta_customize} →</Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {offers.slice(0, 6).map((o) => {
                const single = minPrice("KS") * o.qty;
                return (
                  <Link key={o.id} href={`/${lang}/create?box=${o.id}`} className="block rounded-2xl bg-white/10 p-5 transition hover:bg-white/20">
                    <div className="text-white/70 text-[14px]">{o.qty} {d.cases}</div>
                    <div className="text-[30px] font-semibold leading-tight">{formatPrice(o.prices.KS, "KS", lang)}</div>
                    <div className="text-white/70 text-[13px]">{formatPrice(o.prices.AL, "AL", lang)} · {formatPrice(o.prices.MK, "MK", lang)}</div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {single > o.prices.KS ? <span className="rounded-full bg-brand px-2.5 py-1 text-[12px] font-semibold" style={{ color: "#fff" }}>{d.save_word} {formatPrice(single - o.prices.KS, "KS", lang)}</span> : <span />}
                      <span className="font-semibold text-[14px]">{d.choose} →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="font-display text-[32px] sm:text-[40px] font-bold">{d.how_title}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[[d.how_1_t, d.how_1_d], [d.how_2_t, d.how_2_d], [d.how_3_t, d.how_3_d]].map(([title, desc], i) => (
              <div key={i} className="card p-6">
                <div className="w-10 h-10 rounded-full bg-ink text-white grid place-items-center font-bold">{i + 1}</div>
                <h3 className="mt-5 text-[19px] font-semibold">{title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESIGNS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[32px] sm:text-[40px] font-bold">{d.featured}</h2>
          <Link href={`/${lang}/designs`} className="font-semibold hover:underline whitespace-nowrap">{d.see_all} →</Link>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          <Link href={`/${lang}/designs`} className="chip-on">{d.all}</Link>
          {cats.map((c) => (
            <Link key={c.id} href={`/${lang}/designs?c=${c.slug}`} className="chip">{lang === "sq" ? c.name_sq : c.name_en}</Link>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {designs.map((x) => (
            <DesignCard key={x.id} lang={lang} d={{ ...x, category: catName(x.category_id) }} />
          ))}
        </div>
      </section>

      {/* BESTSELLERS: appears once at least two of our designs have been ordered */}
      {best.length >= 2 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20">
          <h2 className="font-display text-[32px] sm:text-[40px] font-bold">🔥 {d.bestsellers}</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {best.map((x) => <DesignCard key={x.id} lang={lang} d={{ ...x, category: catName(x.category_id) }} />)}
          </div>
        </section>
      )}

      {/* USPs */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 grid gap-4 md:grid-cols-3">
        {[["💵", d.cod_title, d.cod_desc], ["🚚", d.ship_title, d.ship_desc], ["✨", d.quality_title, d.quality_desc]].map(([icon, title, desc]) => (
          <div key={title} className="card p-6 flex gap-4">
            <div className="text-[26px]">{icon}</div>
            <div><h3 className="font-semibold">{title}</h3><p className="text-muted mt-1 leading-relaxed">{desc}</p></div>
          </div>
        ))}
      </section>
    </>
  );
}
