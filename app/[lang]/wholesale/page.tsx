import type { Metadata } from "next";
import WholesaleForm from "@/components/WholesaleForm";
import { isLang, t, type Lang } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").wholesale };
}

export default async function WholesalePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const d = t(lang);
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[36px] sm:text-[48px] font-bold leading-tight">{d.wholesale}</h1>
      <p className="text-muted text-[17px] mt-3">{d.wholesale_sub}</p>
      <WholesaleForm lang={lang} />
    </div>
  );
}
