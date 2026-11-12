"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import CaseFrame from "./CaseFrame";
import { getPhone, DEFAULT_PHONE, type PhoneModel } from "@/lib/phones";
import { t, type Lang } from "@/lib/i18n";

export type BrowserDesign = { id: number; name: string; image_url: string; category: string | null };

export default function DesignBrowser({
  lang, designs, categories, initialCategory = null, linkMode = false, onPick, phone,
}: {
  lang: Lang;
  designs: BrowserDesign[];
  categories: { slug: string; name: string }[];
  initialCategory?: string | null;
  linkMode?: boolean;
  onPick?: (d: BrowserDesign) => void;
  phone?: PhoneModel;
}) {
  const d = t(lang);
  const [cat, setCat] = useState<string | null>(initialCategory);
  const [q, setQ] = useState("");
  const model = phone ?? getPhone(DEFAULT_PHONE);
  const catName = (slug: string | null) => categories.find((c) => c.slug === slug)?.name ?? "";

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return designs.filter((x) => (!cat || x.category === cat) && (!s || x.name.toLowerCase().includes(s) || catName(x.category).toLowerCase().includes(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs, cat, q]);

  return (
    <div>
      {linkMode && (
        <Link href={`/${lang}/create?mode=photo`} className="btn-light w-full mt-6 h-14">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v4h16v-4" /></svg>
          {d.upload_own}
        </Link>
      )}
      <input className="input mt-4 h-14" placeholder={d.search_designs} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        <button className={cat === null ? "chip-on" : "chip"} onClick={() => setCat(null)}>{d.all}</button>
        {categories.map((c) => (
          <button key={c.slug} className={cat === c.slug ? "chip-on uppercase" : "chip uppercase"} onClick={() => setCat(c.slug)}>{c.name}</button>
        ))}
      </div>
      {list.length === 0 && <p className="text-muted py-16 text-center">{d.no_designs}</p>}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        {list.map((x) => {
          const inner = (
            <>
              <div className="px-1 pt-1 transition group-hover:-translate-y-1">
                <CaseFrame model={model} image={x.image_url} className="w-full h-auto case-shadow" />
              </div>
              <div className="mt-4 px-1 text-left">
                <div className="font-semibold uppercase tracking-tight leading-tight">{x.name}</div>
                <div className="text-[13px] text-muted uppercase">{catName(x.category)}</div>
              </div>
            </>
          );
          return linkMode ? (
            <Link key={x.id} href={`/${lang}/create?design=${x.id}`} className="group block">{inner}</Link>
          ) : (
            <button key={x.id} onClick={() => onPick?.(x)} className="group block w-full">{inner}</button>
          );
        })}
      </div>
    </div>
  );
}
