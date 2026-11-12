import type { Metadata } from "next";
import DesignBrowser from "@/components/DesignBrowser";
import { getCategories, getDesigns } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").our_designs };
}

export default async function DesignsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ c?: string }> }) {
  const { lang: l } = await params;
  const { c } = await searchParams;
  const lang: Lang = isLang(l) ? l : "sq";
  const d = t(lang);
  const [designs, cats] = await Promise.all([getDesigns(), getCategories()]);
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[40px] sm:text-[52px] font-bold">{d.our_designs}</h1>
      <p className="text-muted text-[17px] mt-2">{d.our_designs_sub}</p>
      <DesignBrowser
        lang={lang}
        initialCategory={c ?? null}
        categories={cats.map((x) => ({ slug: x.slug, name: lang === "sq" ? x.name_sq : x.name_en }))}
        designs={designs.map((x) => ({ id: x.id, name: x.name, image_url: x.image_url, category: x.category_slug ?? null }))}
        linkMode
      />
    </div>
  );
}
