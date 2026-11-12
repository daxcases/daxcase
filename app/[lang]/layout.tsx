import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fonts from "@/components/Fonts";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import InstallPrompt from "@/components/InstallPrompt";
import WelcomePopup from "@/components/WelcomePopup";
import CartReminder from "@/components/CartReminder";
import { getMarketing } from "@/lib/db";
import { DEFAULT_MARKETING } from "@/lib/cart";
import { isLang, t, type Lang } from "@/lib/i18n";
import { STORE } from "@/lib/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l: Lang = isLang(lang) ? lang : "sq";
  const d = t(l);
  return {
    title: { default: `${STORE.shortName} · ${d.hero_title_1} ${d.hero_title_2}`, template: `%s · ${STORE.shortName}` },
    description: d.footer_about,
    appleWebApp: { capable: true, title: STORE.shortName, statusBarStyle: "default" },
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    alternates: { languages: { sq: "/sq", en: "/en" } },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, maximumScale: 1 };

export function generateStaticParams() {
  return [{ lang: "sq" }, { lang: "en" }];
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const marketing = await getMarketing().catch(() => DEFAULT_MARKETING);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /><Fonts /></head>
      <body className="min-h-dvh flex flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} />
        <InstallPrompt lang={lang} />
        <CartReminder lang={lang} />
        {marketing.welcomeOn && <WelcomePopup lang={lang} percent={marketing.welcomePercent} />}
      </body>
    </html>
  );
}
