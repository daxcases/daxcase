import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { getOffers, getPricing } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").checkout_title };
}

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const [pricing, offers] = await Promise.all([getPricing(), getOffers()]);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[38px] sm:text-[48px] font-bold">{t(lang).checkout_title}</h1>
      <CheckoutForm lang={lang} pricing={pricing} offers={offers} />
    </div>
  );
}
