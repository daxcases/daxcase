import type { Metadata } from "next";
import CartView from "@/components/CartView";
import { getMarketing, getOffers, getPricing } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").cart };
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const [pricing, offers, marketing] = await Promise.all([getPricing(), getOffers(), getMarketing()]);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[38px] sm:text-[48px] font-bold">{t(lang).cart_title}</h1>
      <CartView lang={lang} pricing={pricing} offers={offers} marketing={marketing} />
    </div>
  );
}
