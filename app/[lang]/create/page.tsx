import type { Metadata } from "next";
import Wizard from "@/components/Wizard";
import { getActiveMaterials, getSoldOutPhones, getAllPhones, getCategories, getDesigns, getUnavailablePhones, getPricing } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").cta_customize };
}

export default async function CreatePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ design?: string; mode?: string; box?: string }> }) {
  const { lang: l } = await params;
  const sp = await searchParams;
  const lang: Lang = isLang(l) ? l : "sq";
  const [designs, cats, pricing, off, PHONES, materials, stickers, soldOutIds] = await Promise.all([getDesigns(), getCategories(), getPricing(), getUnavailablePhones(), getAllPhones(), getActiveMaterials(), getDesigns({ kind: "sticker" }), getSoldOutPhones()]);
  const mode = sp.mode === "photo" || sp.mode === "text" || sp.mode === "emoji" ? sp.mode : null;
  return (
    <Wizard
      lang={lang}
      materials={materials}
      soldOut={PHONES.filter((p) => soldOutIds.includes(p.id))}
      stickers={stickers.map((x) => ({ id: x.id, name: x.name, image_url: x.image_url }))}
      phones={PHONES.filter((p) => !off.includes(p.id))}
      pricing={pricing}
      categories={cats.map((x) => ({ slug: x.slug, name: lang === "sq" ? x.name_sq : x.name_en }))}
      designs={designs.map((x) => ({ id: x.id, name: x.name, image_url: x.image_url, category: x.category_slug ?? null }))}
      initialDesignId={sp.design ? Number(sp.design) || null : null}
      initialMode={mode}
      initialBox={sp.box ? sp.box.slice(0, 40) : null}
    />
  );
}
