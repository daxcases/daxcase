import type { Metadata } from "next";
import Quiz from "@/components/Quiz";
import { getCategories, getDesigns } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").quiz };
}

export default async function QuizPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const d = t(lang);
  const [designs, cats] = await Promise.all([getDesigns(), getCategories()]);
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[36px] sm:text-[48px] font-bold leading-tight">{d.quiz}</h1>
      <p className="text-muted text-[17px] mt-2">{d.quiz_sub}</p>
      <Quiz lang={lang} categories={cats.map((c) => ({ slug: c.slug, name: lang === "sq" ? c.name_sq : c.name_en }))}
        designs={designs.map((x) => ({ id: x.id, name: x.name, image_url: x.image_url, category: x.category_slug ?? null }))} />
    </div>
  );
}
