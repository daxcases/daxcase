"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readCart } from "./Wizard";
import type { Lang } from "@/lib/i18n";

/** Basket icon in the header, with the number of cases in it */
export default function CartLink({ lang, label }: { lang: Lang; label: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const upd = () => setN(readCart().reduce((a, x) => a + (x.qty || 1), 0));
    upd();
    window.addEventListener("dax-cart", upd);
    return () => window.removeEventListener("dax-cart", upd);
  }, []);
  return (
    <Link href={`/${lang}/cart`} aria-label={label} className="relative w-10 h-10 grid place-items-center rounded-xl border border-line hover:border-ink">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" /></svg>
      {n > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand text-[11px] font-bold grid place-items-center" style={{ color: "#fff" }}>{n}</span>}
    </Link>
  );
}
