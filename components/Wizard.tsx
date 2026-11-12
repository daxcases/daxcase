"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CaseFrame from "./CaseFrame";
import Case3D from "./Case3D";
import DesignBrowser, { type BrowserDesign } from "./DesignBrowser";
import Editor, { FONT_LINK, type EditorHandle, type Sticker, type Tool } from "./Editor";
import { getPhone, type PhoneModel } from "@/lib/phones";
import { CITIES, COUNTRIES, POPULAR } from "@/lib/locations";
import { CASE_COLORS, formatPrice, fromPrice, type CountryCode, type Finish, type Material, type Pricing } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";

export type Draft = {
  country: CountryCode; city: string; phoneId: string; phone?: PhoneModel; material: string; finish: Finish; materialName: { sq: string; en: string }; caseColor: string;
  qty: number; custom: boolean; printUrl: string; previewUrl: string; designId: number | null; designName: string | null;
};
import { CART_KEY, MAX_CART_ITEMS } from "@/lib/cart";

export function readCart(): Draft[] {
  try { const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(c) ? c : []; } catch { return []; }
}
/** The customer's choices for the whole basket: which OFERTA BOX and which discount code */
export type CartExtras = { offerId: string | null; code: string; percent: number; welcome?: string };
export const WELCOME_KEY = "dax-welcome";
export function readExtras(): CartExtras {
  try { return { offerId: null, code: "", percent: 0, ...JSON.parse(localStorage.getItem("dax-extras") || "{}"), welcome: localStorage.getItem(WELCOME_KEY) || "" }; } catch { return { offerId: null, code: "", percent: 0 }; }
}
export function writeExtras(e: CartExtras) {
  try { localStorage.setItem("dax-extras", JSON.stringify(e)); } catch {}
}
export function writeCart(c: Draft[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(c)); window.dispatchEvent(new Event("dax-cart")); } catch {}
}
const STATE_KEY = "dax-wizard";

function Chevron() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0"><path d="M9 6l6 6-6 6" /></svg>;
}

export default function Wizard({
  lang, pricing, designs, categories, initialDesignId, initialMode, phones, materials, initialBox, stickers, soldOut = [],
}: {
  phones: PhoneModel[];
  materials: Material[];
  stickers?: Sticker[];
  soldOut?: PhoneModel[];
  lang: Lang; pricing: Pricing; designs: BrowserDesign[]; categories: { slug: string; name: string }[];
  initialDesignId: number | null; initialMode: Tool | null; initialBox?: string | null;
}) {
  const d = t(lang);
  const router = useRouter();
  const editor = useRef<EditorHandle>(null);
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState<CountryCode | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [phoneId, setPhoneId] = useState<string | null>(null);
  const [brand, setBrand] = useState<"apple" | "samsung">(phones.some((p) => p.brand === "apple") ? "apple" : "samsung");
  const [design, setDesign] = useState<BrowserDesign | null>(designs.find((x) => x.id === initialDesignId) ?? null);
  const [designView, setDesignView] = useState<"choose" | "edit">(initialDesignId || initialMode ? "edit" : "choose");
  const [tab, setTab] = useState<"ours" | "yours">(initialMode ? "yours" : "ours");
  const [pendingTool, setPendingTool] = useState<Tool | null>(initialMode);
  const [editorMounted, setEditorMounted] = useState(false);
  const [material, setMaterial] = useState<string>((materials.find((m) => m.id === "glossy") ?? materials[0]).id);
  const mat = materials.find((m) => m.id === material) ?? materials[0];
  const finish = mat.finish;
  const [caseColor, setCaseColor] = useState(CASE_COLORS[0].hex);
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState(false);
  const [view3d, setView3d] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitFor, setWaitFor] = useState<string | null>(null);
  const [waitContact, setWaitContact] = useState("");
  const [waitDone, setWaitDone] = useState<string[]>([]);
  const joinWait = async (phoneId: string) => {
    if (waitContact.replace(/\D/g, "").length < 8) return;
    await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phoneId, contact: waitContact }) }).catch(() => {});
    setWaitDone((x) => [...x, phoneId]); setWaitFor(null);
  };
  const [error, setError] = useState<string | null>(null);

  // remember country / city / phone between visits
  useEffect(() => {
    if (initialBox) writeExtras({ ...readExtras(), offerId: initialBox });
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (s?.country && s?.city && s?.phoneId && phones.some((p) => p.id === s.phoneId)) {
        setCountry(s.country); setCity(s.city); setPhoneId(s.phoneId);
        setBrand(phones.find((p) => p.id === s.phoneId)?.brand ?? "apple");
        if (initialDesignId || initialMode) setStep(3);
        else if (readCart().length) setStep(2); // adding another case: go straight to the phone model
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (country && city && phoneId) try { localStorage.setItem(STATE_KEY, JSON.stringify({ country, city, phoneId })); } catch {}
  }, [country, city, phoneId]);

  useEffect(() => { if (step === 3 && designView === "edit") setEditorMounted(true); }, [step, designView]);
  useEffect(() => { setQ(""); window.scrollTo({ top: 0 }); }, [step, designView]);
  // open the requested tool once the editor is on screen
  useEffect(() => {
    if (!(editorMounted && pendingTool && step === 3 && designView === "edit")) return;
    const id = setTimeout(() => { editor.current?.openTool(pendingTool); setPendingTool(null); }, 600);
    return () => clearTimeout(id);
  }, [editorMounted, pendingTool, step, designView]);

  const phone = phones.find((p) => p.id === phoneId) ?? phones[0] ?? getPhone(null);
  const price = country ? pricing[country].prices[material] + (custom ? pricing[country].custom : 0) : 0;
  const fmt = (n: number) => (country ? formatPrice(n, country, lang) : "");
  const minPrice = (c: CountryCode) => fromPrice(pricing, c);

  const back = () => {
    setError(null);
    if (step === 3 && designView === "edit") { setDesignView("choose"); return; }
    setStep((s) => Math.max(0, s - 1));
  };

  const toPreview = () => {
    if (editor.current?.isEmpty() && !design) { setError(d.ed_need_content); return; }
    setError(null);
    setCustom(editor.current!.isCustom());
    setPreview(editor.current!.exportPreview());
    setStep(4);
  };

  const upload = async (blob: Blob, kind: string) => {
    const res = await fetch(`/api/upload?kind=${kind}`, { method: "POST", headers: { "content-type": blob.type || "image/jpeg" }, body: blob });
    if (!res.ok) {
      let info = "";
      try { const j = await res.json(); info = `${j.error ?? ""} ${j.detail ?? ""}`; } catch {}
      throw new Error(`upload ${kind} failed: HTTP ${res.status} ${info}`.trim());
    }
    const url = (await res.json()).url as string | undefined;
    if (!url) throw new Error(`upload ${kind} returned no url`);
    return url;
  };

  const order = async () => {
    if (!country || !city || !preview) return;
    setBusy(true); setError(null);
    try {
      const print = await editor.current!.exportPrint();
      const prev = await (await fetch(preview)).blob();
      const [printUrl, previewUrl] = await Promise.all([upload(print, "print"), upload(prev, "preview")]);
      const draft: Draft = { country, city, phoneId: phone.id, phone, material, finish, materialName: { sq: mat.sq, en: mat.en }, caseColor, qty, custom, printUrl, previewUrl, designId: design?.id ?? null, designName: design?.name ?? null };
      // delivery country and city belong to the whole order, so every case in the basket follows the latest choice
      const cart = readCart().map((x) => ({ ...x, country, city })).slice(0, MAX_CART_ITEMS - 1);
      writeCart([...cart, draft]);
      router.push(`/${lang}/cart`);
    } catch (e) {
      console.error("[add-to-cart]", e);
      setError(d.order_error); setBusy(false);
    }
  };

  const steps = [d.step_country, d.step_city, d.step_phone, d.step_design, d.step_preview];
  const cityList = useMemo(() => {
    if (!country) return [];
    const s = q.trim().toLowerCase();
    return CITIES[country].filter((c) => !s || c.toLowerCase().includes(s));
  }, [country, q]);
  const phoneList = useMemo(() => {
    const s = q.trim().toLowerCase();
    return phones.filter((p) => (s ? p.name.toLowerCase().includes(s) : p.brand === brand));
  }, [brand, q, phones]);

  const optionCard = "w-full card px-5 py-4 flex items-center gap-4 text-left transition hover:border-ink";

  return (
    <div className={`mx-auto px-4 sm:px-6 pt-6 ${step === 3 && designView === "choose" && tab === "ours" ? "max-w-5xl" : "max-w-2xl"}`}>
      <link rel="stylesheet" href={FONT_LINK} />
      {/* progress */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button onClick={back} aria-label={d.back} className="w-11 h-11 shrink-0 rounded-xl border border-line grid place-items-center hover:border-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m0 0 6-6m-6 6 6 6" /></svg>
          </button>
        )}
        <div className="flex-1 grid grid-cols-5 gap-2">
          {steps.map((s, i) => (
            <div key={s}>
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`} />
              <div className={`hidden sm:block mt-2 text-[12px] ${i === step ? "font-semibold" : "text-muted"}`}>{s}</div>
            </div>
          ))}
        </div>
        <span className="text-[14px] text-muted tabular-nums">{step + 1}/5</span>
      </div>

      {/* 1 — country */}
      {step === 0 && (
        <section className="mt-10">
          <h1 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">{d.q_country}</h1>
          <p className="text-muted text-[17px] mt-2">{d.q_country_sub}</p>
          <div className="mt-8 space-y-3">
            {COUNTRIES.map((c) => (
              <button key={c.code} onClick={() => { if (country !== c.code) setCity(null); setCountry(c.code); setStep(1); }}
                className={`${optionCard} py-5 ${country === c.code ? "border-ink ring-1 ring-ink" : ""}`}>
                <span className="text-[34px] leading-none">{c.flag}</span>
                <span className="flex-1">
                  <span className="block text-[19px] font-semibold">{lang === "sq" ? c.sq : c.en}</span>
                  <span className="block text-muted">{d.from_cap} {formatPrice(minPrice(c.code), c.code, lang)}</span>
                </span>
                <Chevron />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2 — city */}
      {step === 1 && country && (
        <section className="mt-10">
          <h1 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">{d.q_city}</h1>
          <p className="text-muted text-[17px] mt-2">{d.q_city_sub}</p>
          <input className="input h-14 mt-6" placeholder={d.search_city} value={q} onChange={(e) => setQ(e.target.value)} />
          {!q && (
            <>
              <div className="mt-6 text-[13px] font-semibold text-muted uppercase tracking-wide">{d.popular}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR[country].map((c) => (
                  <button key={c} className={city === c ? "chip-on" : "chip"} onClick={() => { setCity(c); setStep(2); }}>{c}</button>
                ))}
              </div>
              <div className="mt-8 text-[13px] font-semibold text-muted uppercase tracking-wide">{d.all_cities} ({CITIES[country].length})</div>
            </>
          )}
          <div className="mt-3 space-y-2">
            {cityList.map((c) => (
              <button key={c} onClick={() => { setCity(c); setStep(2); }} className={`${optionCard} ${city === c ? "border-ink ring-1 ring-ink" : ""}`}>
                <span className="flex-1 text-[16px] font-medium">{c}</span>
                {city === c ? <span>✓</span> : <Chevron />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3 — phone */}
      {step === 2 && (
        <section className="mt-10">
          <h1 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">{d.q_phone}</h1>
          <input className="input h-14 mt-6" placeholder={d.search_model} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-4 flex gap-2">
            {phones.some((p) => p.brand === "apple") && <button className={brand === "apple" ? "chip-on h-12 px-6" : "chip h-12 px-6"} onClick={() => setBrand("apple")}>Apple</button>}
            {phones.some((p) => p.brand === "samsung") && <button className={brand === "samsung" ? "chip-on h-12 px-6" : "chip h-12 px-6"} onClick={() => setBrand("samsung")}>Samsung</button>}
          </div>
          <div className="mt-4 space-y-2">
            {phoneList.map((p) => (
              <button key={p.id} onClick={() => { setPhoneId(p.id); setBrand(p.brand); setStep(3); }}
                className={`${optionCard} ${phoneId === p.id ? "border-ink ring-1 ring-ink" : ""}`}>
                <span className="w-6 shrink-0"><CaseFrame model={p} background="#f1f1f2" caseColor="#2a2a2e" className="w-full h-auto" /></span>
                <span className="flex-1 text-[18px] font-medium">{p.name}</span>
                {phoneId === p.id && <span>✓</span>}
              </button>
            ))}
            {soldOut.filter((p) => (q.trim() ? p.name.toLowerCase().includes(q.trim().toLowerCase()) : p.brand === brand)).map((p) => (
              <div key={p.id} className="card px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className="w-6 shrink-0 opacity-40"><CaseFrame model={p} background="#f1f1f2" caseColor="#2a2a2e" className="w-full h-auto" /></span>
                  <span className="flex-1 text-[18px] font-medium text-muted">{p.name} <span className="text-[13px]">· {d.sold_out}</span></span>
                  {waitDone.includes(p.id) ? <span className="text-[13px] text-green-700">✓</span> : <button className="chip h-9 text-[13px]" onClick={() => setWaitFor(waitFor === p.id ? null : p.id)}>🔔 {d.notify_me}</button>}
                </div>
                {waitFor === p.id && (
                  <div className="flex gap-2 mt-3">
                    <input className="input" type="tel" placeholder={d.notify_ph} value={waitContact} onChange={(e) => setWaitContact(e.target.value)} />
                    <button className="btn-dark px-5" onClick={() => joinWait(p.id)}>OK</button>
                  </div>
                )}
                {waitDone.includes(p.id) && <p className="text-[13px] text-green-700 mt-2">{d.notify_done}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4 — design */}
      {step === 3 && designView === "choose" && (
        <section className="mt-10">
          <h1 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">{d.q_design}</h1>
          <div className="mt-6 grid grid-cols-2 p-1.5 rounded-2xl bg-paper border border-line max-w-xl">
            {(["ours", "yours"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`h-12 rounded-xl text-[16px] font-medium transition ${tab === k ? "bg-white shadow-sm" : "text-muted"}`}>
                {k === "ours" ? d.our_designs : d.your_design}
              </button>
            ))}
          </div>
          {tab === "ours" ? (
            <DesignBrowser lang={lang} designs={designs} categories={categories} phone={phone}
              onPick={(x) => { setDesign(x); setDesignView("edit"); }} />
          ) : (
            <div className="max-w-xl">
              <p className="text-muted text-[17px] mt-6">{d.what_on_case}</p>
              <div className="mt-4 space-y-3">
                {([
                  ["photo", d.opt_photo, d.opt_photo_d, "M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2 1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"],
                  ["text", d.opt_text, d.opt_text_d, "M5 6V4h14v2M12 4v16m-3 0h6"],
                  ["emoji", d.opt_emoji, d.opt_emoji_d, "M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01"],
                  [null, d.opt_mix, d.opt_mix_d, "M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5"],
                ] as const).map(([k, title, desc, icon]) => (
                  <button key={title} className={optionCard} onClick={() => { setDesign(null); setPendingTool(k as Tool | null); setDesignView("edit"); }}>
                    <span className="w-12 h-12 rounded-xl bg-paper grid place-items-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                    </span>
                    <span className="flex-1">
                      <span className="block text-[18px] font-semibold">{title}</span>
                      <span className="block text-muted">{desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-muted mt-5">{d.same_price}</p>
            </div>
          )}
        </section>
      )}

      {editorMounted && (
        <section className={step === 3 && designView === "edit" ? "mt-6" : "hidden"}>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-[24px] font-bold">{design ? design.name : d.your_design}</h1>
            <button className="text-[14px] text-muted underline" onClick={() => setStep(2)}>{phone.name}</button>
          </div>
          <Editor ref={editor} lang={lang} model={phone} material={finish} caseColor={caseColor}
            designUrl={design?.image_url ?? null} initialTool={null} stickers={stickers} hidden={!(step === 3 && designView === "edit")} />
          {error && <p className="text-red-600 text-[14px] mt-3">{error}</p>}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 mt-4 bg-white/90 backdrop-blur border-t border-line">
            <button onClick={toPreview} className="btn-dark w-full h-14 text-[16px]">{d.continue} →</button>
          </div>
        </section>
      )}

      {/* 5 — preview */}
      {step === 4 && country && (
        <section className="mt-8">
          <h1 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">{d.q_preview}</h1>
          <div className="mt-6 grid sm:grid-cols-[240px_1fr] gap-8 items-start">
            <div className="mx-auto w-[210px] sm:w-full">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-paper border border-line mb-5 text-[13px] font-semibold">
                <button onClick={() => setView3d(false)} className={`h-9 rounded-lg ${!view3d ? "bg-white shadow-sm" : "text-muted"}`}>{d.view_2d}</button>
                <button onClick={() => setView3d(true)} className={`h-9 rounded-lg ${view3d ? "bg-white shadow-sm" : "text-muted"}`}>{d.view_3d}</button>
              </div>
              {view3d
                ? <Case3D model={phone} image={preview} material={finish} caseColor={caseColor} />
                : <CaseFrame model={phone} image={preview} material={finish} caseColor={caseColor} className="w-full h-auto case-shadow" />}
              <p className="text-center text-[13px] text-muted mt-4">{view3d ? d.drag_rotate : phone.name}</p>
            </div>
            <div className="space-y-7">
              <div>
                <div className="label">{d.material}</div>
                <div className="space-y-2">
                  {materials.map((m) => (
                    <button key={m.id} onClick={() => setMaterial(m.id)} className={`${optionCard} py-3 ${material === m.id ? "border-ink ring-1 ring-ink" : ""}`}>
                      <span className="flex-1">
                        <span className="block font-semibold">{lang === "sq" ? m.sq : m.en}</span>
                        <span className="block text-[14px] text-muted">{lang === "sq" ? m.descSq : m.descEn}</span>
                      </span>
                      <span className="font-semibold whitespace-nowrap">{fmt(pricing[country].prices[m.id])}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="label">{d.case_color}</div>
                <div className="flex gap-3 flex-wrap">
                  {CASE_COLORS.map((c) => (
                    <button key={c.id} onClick={() => setCaseColor(c.hex)} title={lang === "sq" ? c.sq : c.en}
                      className={`w-11 h-11 rounded-full border ${caseColor === c.hex ? "ring-2 ring-offset-2 ring-ink" : "border-line"}`} style={{ background: c.hex }} />
                  ))}
                </div>
              </div>
              <div>
                <div className="label">{d.quantity}</div>
                <div className="inline-flex items-center rounded-xl border border-line">
                  <button className="w-12 h-12 text-[20px]" onClick={() => setQty((x) => Math.max(1, x - 1))}>−</button>
                  <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
                  <button className="w-12 h-12 text-[20px]" onClick={() => setQty((x) => Math.min(10, x + 1))}>+</button>
                </div>
              </div>
              <div className="card p-4 text-[15px] space-y-2 bg-paper">
                <div className="flex justify-between font-semibold text-[17px]"><span>{d.subtotal}</span><span>{fmt(price * qty)}</span></div>
                {custom && <div className="flex justify-between text-[13px] text-muted"><span>{d.custom_fee}</span><span>+{fmt(pricing[country].custom)}</span></div>}
              </div>
            </div>
          </div>
          {error && <p className="text-red-600 text-[14px] mt-3">{error}</p>}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 mt-6 bg-white/90 backdrop-blur border-t border-line">
            <button onClick={order} disabled={busy} className="btn-dark w-full h-14 text-[16px]">
              {busy ? d.preparing : `${d.add_to_cart} · ${fmt(price * qty)}`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
