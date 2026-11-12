"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readCart } from "./Wizard";
import { t, type Lang } from "@/lib/i18n";

/** A small bar for visitors who left cases in the basket and came back */
export default function CartReminder({ lang }: { lang: Lang }) {
  const d = t(lang);
  const path = usePathname() || "";
  const [show, setShow] = useState(false);
  useEffect(() => {
    let closed = false;
    try { closed = sessionStorage.getItem("dax-reminder-closed") === "1"; } catch {}
    setShow(!closed && !/\/(cart|checkout|create|order)/.test(path) && readCart().length > 0);
  }, [path]);
  if (!show) return null;
  return (
    <div className="fixed z-40 left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] bottom-3 sm:bottom-6 rounded-2xl bg-ink text-white shadow-2xl p-4 flex items-center gap-3">
      <span className="text-[22px]">🛍️</span>
      <span className="flex-1 text-[14.5px] font-medium">{d.reminder}</span>
      <Link href={`/${lang}/cart`} className="h-10 px-4 rounded-xl bg-brand text-[14px] font-semibold inline-flex items-center whitespace-nowrap" style={{ color: "#fff" }}>{d.see_cart}</Link>
      <button aria-label="Close" onClick={() => { setShow(false); try { sessionStorage.setItem("dax-reminder-closed", "1"); } catch {} }} className="w-8 h-8 grid place-items-center">✕</button>
    </div>
  );
}
