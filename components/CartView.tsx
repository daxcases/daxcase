"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CaseFrame from "./CaseFrame";
import { readCart, readExtras, writeCart, writeExtras, type CartExtras, type Draft } from "./Wizard";
import { getPhone } from "@/lib/phones";
import { priceCart, type Marketing, type Offer } from "@/lib/cart";
import { formatPrice, type Pricing } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";

export default function CartView({ lang, pricing, offers, marketing }: { lang: Lang; pricing: Pricing; offers: Offer[]; marketing: Marketing }) {
  const d = t(lang);
  const [cart, setCart] = useState<Draft[] | null>(null);
  const [ex, setEx] = useState<CartExtras>({ offerId: null, code: "", percent: 0 });
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState<"" | "bad" | "busy">("");
  const [welcome, setWelcome] = useState(0);
  useEffect(() => {
    setCart(readCart()); const e = readExtras(); setEx(e); setCodeInput(e.code);
    // does this email still have its welcome discount?
    if (e.welcome) fetch(`/api/subscribe?email=${encodeURIComponent(e.welcome)}`).then((r) => r.json()).then((r) => setWelcome(r.percent || 0)).catch(() => {});
  }, []);
  const saveEx = (e: CartExtras) => { setEx(e); writeExtras(e); };
  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) { saveEx({ ...ex, code: "", percent: 0 }); setCodeMsg(""); return; }
    setCodeMsg("busy");
    try {
      const r = await (await fetch(`/api/discount?code=${encodeURIComponent(code)}`)).json();
      if (r.ok) { saveEx({ ...ex, code: r.code, percent: r.percent }); setCodeInput(r.code); setCodeMsg(""); }
      else { saveEx({ ...ex, code: "", percent: 0 }); setCodeMsg("bad"); }
    } catch { setCodeMsg("bad"); }
  };
  if (cart === null) return <div className="py-24" />;
  if (!cart.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted text-[17px]">{d.cart_empty}</p>
        <Link href={`/${lang}/create`} className="btn-dark mt-6">{d.start_design}</Link>
      </div>
    );
  }
  const country = cart[0].country;
  const fmt = (n: number) => formatPrice(n, country, lang);
  const p = pricing[country];
  const useWelcome = welcome > ex.percent;
  const tot = priceCart(cart, pricing, offers, country, { ...ex, percent: Math.max(ex.percent, welcome) });
  const update = (next: Draft[]) => { setCart(next); writeCart(next); };
  const setQty = (i: number, q: number) => update(cart.map((x, k) => (k === i ? { ...x, qty: Math.max(1, Math.min(10, q)) } : x)));

  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div>
        <div className="card divide-y divide-line">
          {cart.map((x, i) => {
            const unit = (p.prices[x.material] ?? 0) + (x.custom ? p.custom : 0);
            return (
              <div key={i} className="p-4 flex gap-4 items-center">
                <div className="w-16 shrink-0"><CaseFrame model={x.phone ?? getPhone(x.phoneId)} image={x.previewUrl} material={x.finish} caseColor={x.caseColor} className="w-full h-auto" /></div>
                <div className="flex-1 min-w-0 text-[15px]">
                  <div className="font-semibold">{(x.phone ?? getPhone(x.phoneId)).name}</div>
                  <div className="text-muted truncate">{x.materialName?.[lang]} · {x.custom ? d.personalised : x.designName ?? d.regular}</div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center rounded-lg border border-line">
                      <button className="w-9 h-9" onClick={() => setQty(i, x.qty - 1)} aria-label="−">−</button>
                      <span className="w-7 text-center font-semibold tabular-nums">{x.qty}</span>
                      <button className="w-9 h-9" onClick={() => setQty(i, x.qty + 1)} aria-label="+">+</button>
                    </span>
                    <button className="text-[13px] text-muted underline" onClick={() => update(cart.filter((_, k) => k !== i))}>{d.remove}</button>
                  </div>
                </div>
                <div className="font-semibold whitespace-nowrap">{fmt(unit * x.qty)}</div>
              </div>
            );
          })}
        </div>
        <Link href={`/${lang}/create`} className="btn-light w-full h-14 mt-4">+ {d.add_another}</Link>

        {offers.length > 0 && (
          <div className="mt-6">
            <div className="text-[13px] font-semibold tracking-wide">{d.offer_box}</div>
            <p className="text-[13px] text-muted">{d.offer_pick}</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {offers.map((o) => {
                const on = ex.offerId === o.id;
                return (
                  <button key={o.id} onClick={() => saveEx({ ...ex, offerId: on ? null : o.id })} aria-pressed={on}
                    className={`text-left rounded-xl border p-3 transition ${on ? "border-brand ring-1 ring-brand bg-red-50" : "border-line hover:border-ink"}`}>
                    <div className="flex items-center justify-between text-[13px] text-muted"><span>{o.qty} {d.cases}</span>
                      <span className={`w-4 h-4 rounded-full border ${on ? "border-[5px] border-brand" : "border-line"}`} /></div>
                    <div className="font-semibold text-[17px]">{fmt(o.prices[country])}</div>
                    <div className="text-[12px] text-muted">{fmt(o.prices[country] / o.qty)} {d.per_case}</div>
                    <div className={`text-[12px] font-semibold mt-1 ${on ? "text-brand" : ""}`}>{on ? `✓ ${d.chosen}` : d.choose}</div>
                  </button>
                );
              })}
            </div>
            {tot.chosen && tot.missing > 0 && (
              <p className="mt-3 rounded-xl bg-paper border border-line px-3 py-2.5 text-[13.5px]">{d.box_missing_1} <b>{tot.missing}</b> {d.box_missing_2}</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <label className="text-[13px] font-semibold tracking-wide" htmlFor="code">{d.discount_code}</label>
          <div className="mt-2 flex gap-2">
            <input id="code" className="input uppercase" placeholder={d.code_ph} value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyCode(); }} autoComplete="off" />
            <button onClick={applyCode} disabled={codeMsg === "busy"} className="btn-light px-6">{d.apply}</button>
          </div>
          {codeMsg === "bad" && <p className="text-red-600 text-[14px] mt-2">{d.code_invalid}</p>}
          {ex.percent > 0 && codeMsg !== "bad" && <p className="text-green-700 text-[14px] mt-2">✓ {d.code_ok}: {ex.code} (−{ex.percent}%)</p>}
        </div>
      </div>

      <div className="card p-5 lg:sticky lg:top-24">
        <h2 className="text-[20px] font-semibold">{d.summary}</h2>
        <div className="mt-4 space-y-2 text-[15px]">
          <div className="flex justify-between"><span className="text-muted">{tot.count} {d.cases}</span><span>{fmt(tot.full)}</span></div>
          {tot.offer && <div className="flex justify-between text-brand font-medium"><span>{d.offer_box} {tot.offer.qty}</span><span>−{fmt(tot.discount)}</span></div>}
          {tot.codeDiscount > 0 && <div className="flex justify-between text-brand font-medium"><span>{useWelcome ? `${d.welcome_line} −${welcome}%` : `${d.discount_code} ${ex.code}`}</span><span>−{fmt(tot.codeDiscount)}</span></div>}
          {marketing.loyaltyOn && <p className="text-[12.5px] text-muted pt-1">🎁 {d.loyalty_progress.replace("{have}", "…").replace(/\{every\}/g, String(marketing.loyaltyEvery)).replace(/^[^.]*\.\s*/, "")}</p>}
          <div className="flex justify-between"><span className="text-muted">{d.shipping} · {cart[0].city}</span><span>{tot.shipping === 0 ? d.free : fmt(tot.shipping)}</span></div>
          <div className="flex justify-between font-semibold text-[18px] pt-2 border-t border-line"><span>{d.total}</span><span>{fmt(tot.total)}</span></div>
        </div>
        <Link href={`/${lang}/checkout`} className="btn-dark w-full h-14 text-[16px] mt-5">{d.to_checkout} →</Link>
        <Link href={`/${lang}/create`} className="block text-center font-semibold mt-4 hover:underline">+ {d.add_another}</Link>
      </div>
    </div>
  );
}
