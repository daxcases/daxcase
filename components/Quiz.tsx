"use client";
import Link from "next/link";
import { useState } from "react";
import CaseFrame from "./CaseFrame";
import { getPhone, DEFAULT_PHONE } from "@/lib/phones";
import { t, type Lang } from "@/lib/i18n";

type D = { id: number; name: string; image_url: string; category: string | null };

export default function Quiz({ lang, designs, categories }: { lang: Lang; designs: D[]; categories: { slug: string; name: string }[] }) {
  const d = t(lang);
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState<string | null>(null);
  const [gift, setGift] = useState(false);
  const [matte, setMatte] = useState(false);
  const opt = "w-full card px-5 py-4 text-left text-[18px] font-semibold transition hover:border-ink flex items-center gap-4";
  const sample = (slug: string) => designs.find((x) => x.category === slug);
  const picks = [...designs.filter((x) => x.category === cat), ...designs.filter((x) => x.category !== cat)].slice(0, 4);
  const model = getPhone(DEFAULT_PHONE);

  return (
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-2 max-w-xs">{[0, 1, 2].map((i) => <div key={i} className={`h-1.5 rounded-full ${i <= Math.min(step, 2) ? "bg-ink" : "bg-line"}`} />)}</div>
      {step === 0 && (
        <div className="mt-8"><h2 className="font-display text-[28px] font-bold">{d.quiz_q1}</h2>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.filter((c) => sample(c.slug)).map((c) => (
              <button key={c.slug} onClick={() => { setCat(c.slug); setStep(1); }} className="card p-3 text-center transition hover:border-ink">
                <CaseFrame model={model} image={sample(c.slug)!.image_url} className="w-2/3 mx-auto h-auto" />
                <div className="font-semibold mt-3">{c.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="mt-8"><h2 className="font-display text-[28px] font-bold">{d.quiz_q2}</h2>
          <div className="mt-5 space-y-3">
            <button className={opt} onClick={() => { setGift(false); setStep(2); }}><span className="text-[26px]">🙋</span>{d.quiz_me}</button>
            <button className={opt} onClick={() => { setGift(true); setStep(2); }}><span className="text-[26px]">🎁</span>{d.quiz_gift}</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="mt-8"><h2 className="font-display text-[28px] font-bold">{d.quiz_q3}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {([[false, d.quiz_shiny, "glossy"], [true, d.quiz_matte, "matte"]] as const).map(([m, label, fin]) => (
              <button key={fin} onClick={() => { setMatte(m); setStep(3); }} className="card p-4 text-center transition hover:border-ink">
                <CaseFrame model={model} image={picks[0]?.image_url} material={fin} className="w-2/3 mx-auto h-auto" />
                <div className="font-semibold mt-3">{label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="mt-8"><h2 className="font-display text-[28px] font-bold">✨ {d.quiz_result}</h2>
          {gift && <p className="mt-3 rounded-xl bg-paper border border-line px-4 py-3 text-[15px]">🎁 {d.quiz_gift_tip}</p>}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8">
            {picks.map((x) => (
              <Link key={x.id} href={`/${lang}/create?design=${x.id}`} className="group block">
                <CaseFrame model={model} image={x.image_url} material={matte ? "matte" : "glossy"} className="w-full h-auto case-shadow transition group-hover:-translate-y-1" />
                <div className="font-semibold uppercase text-[14px] mt-3">{x.name}</div>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href={`/${lang}/create?mode=photo`} className="btn-dark">{d.upload_own}</Link>
            <button className="btn-light" onClick={() => setStep(0)}>{d.quiz_again}</button>
          </div>
        </div>
      )}
    </div>
  );
}
