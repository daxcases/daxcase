import Link from "next/link";
import { Suspense } from "react";
import Logo from "./Logo";
import LangSwitch from "./LangSwitch";
import CartLink from "./CartLink";
import ThemeToggle from "./ThemeToggle";
import { t, type Lang } from "@/lib/i18n";

export default function Header({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href={`/${lang}`} className="text-[22px] sm:text-[24px]" aria-label="Home"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-6 text-[15px] text-muted">
          <Link href={`/${lang}/designs`} className="hover:text-ink">{d.nav_designs}</Link>
          <Link href={`/${lang}/create`} className="hover:text-ink">{d.nav_customize}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <CartLink lang={lang} label={d.cart} />
          <Suspense><LangSwitch lang={lang} /></Suspense>
          <Link href={`/${lang}/designs`} className="hidden min-[480px]:inline md:hidden text-[14px] text-muted hover:text-ink">{d.nav_designs}</Link>
          <span className="hidden md:block"><Link href={`/${lang}/create`} className="btn-dark h-10 text-[14px]">{d.cta_customize}</Link></span>
        </div>
      </div>
    </header>
  );
}
