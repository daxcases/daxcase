"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export default function LangSwitch({ lang }: { lang: Lang }) {
  const path = usePathname() || "/";
  const qs = useSearchParams()?.toString();
  const to = (l: Lang) => path.replace(/^\/(sq|en)(?=\/|$)/, `/${l}`) + (qs ? `?${qs}` : "");
  const item = (l: Lang) => (
    <Link
      key={l}
      href={to(l)}
      onClick={() => { document.cookie = `lang=${l};path=/;max-age=31536000`; }}
      className={`px-3 h-8 inline-flex items-center rounded-lg text-[13px] font-semibold transition ${lang === l ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
    >
      {l.toUpperCase()}
    </Link>
  );
  return <div className="inline-flex p-1 rounded-xl border border-line bg-white">{item("sq")}{item("en")}</div>;
}
