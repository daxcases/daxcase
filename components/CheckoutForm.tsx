"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaseFrame from "./CaseFrame";
import { readCart, readExtras, writeCart, writeExtras, type CartExtras, type Draft } from "./Wizard";
import { priceCart, type Offer } from "@/lib/cart";
import { getPhone } from "@/lib/phones";
import { COUNTRIES } from "@/lib/locations";
import { formatPrice, type Pricing } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";

export default function CheckoutForm({ lang, pricing, offers }: { lang: Lang; pricing: Pricing; offers: Offer[] }) {
  const d = t(lang);
  const router = useRouter();
  const [cart, setCart] = useState<Draft[] | undefined>(undefined);
  const [ex, setEx] = useState<CartExtras>({ offerId: null, code: "", percent: 0 });
  const [welcome, setWelcome] = useState(0);
  const [loyal, setLoyal] = useState<{ every: number; have: number; free: number }>({ every: 0, have: 0, free: 0 });
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    setCart(readCart()); const e = readExtras(); setEx(e);
    if (e.welcome) fetch(`/api/subscribe?email=${encodeURIComponent(e.welcome)}`).then((r) => r.json()).then((r) => setWelcome(r.percent || 0)).catch(() => {});
    // returning customers do not have to type their details again
    try { const saved = JSON.parse(localStorage.getItem("dax-customer") || "null"); if (saved) setF((f) => ({ ...f, ...saved, notes: "" })); } catch {}
  }, []);

  const count = (cart ?? []).reduce((a, x) => a + x.qty, 0);
  useEffect(() => {
    if (f.phone.replace(/\D/g, "").length < 8 || !count) { setLoyal({ every: 0, have: 0, free: 0 }); return; }
    const id = setTimeout(() => {
      fetch(`/api/loyalty?phone=${encodeURIComponent(f.phone)}&n=${count}`).then((r) => r.json()).then(setLoyal).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [f.phone, count]);

  if (cart === undefined) return <div className="py-24" />;
  if (!cart.length) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted text-[17px]">{d.nothing_to_order}</p>
        <Link href={`/${lang}/create`} className="btn-dark mt-6">{d.start_design}</Link>
      </div>
    );
  }

  const draft = cart[0];
  const country = COUNTRIES.find((c) => c.code === draft.country)!;
  const useWelcome = welcome > ex.percent;
  const tot = priceCart(cart, pricing, offers, draft.country, { ...ex, percent: Math.max(ex.percent, welcome), freeUnits: loyal.free });
  const total = tot.total;
  const fmt = (n: number) => formatPrice(n, draft.country, lang);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.firstName.trim()) er.firstName = d.required;
    if (!f.lastName.trim()) er.lastName = d.required;
    if (!f.address.trim()) er.address = d.required;
    if (f.phone.replace(/\D/g, "").length < 8) er.phone = d.invalid_phone;
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(Object.keys(er)[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true); setFail(false);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, lang, country: draft.country, city: draft.city, offerId: ex.offerId, code: ex.code, welcome: ex.welcome || "", items: cart.map(({ phone: _p, materialName: _m, ...x }) => x) }) });
      if (!res.ok) throw new Error();
      const { id, total: charged } = await res.json();
      writeCart([]); writeExtras({ offerId: null, code: "", percent: 0 });
      try { localStorage.setItem("dax-customer", JSON.stringify({ firstName: f.firstName, lastName: f.lastName, phone: f.phone, email: f.email, address: f.address })); } catch {}
      sessionStorage.setItem("dax-last-order", JSON.stringify({ id, total: charged ?? total, country: draft.country, previewUrl: draft.previewUrl, phoneId: draft.phoneId, phone: draft.phone, material: draft.finish, caseColor: draft.caseColor }));
      router.push(`/${lang}/order/${id}`);
    } catch { setFail(true); setBusy(false); }
  };

  const field = (k: keyof typeof f, label: string, opts: { type?: string; ph?: string; help?: string; auto?: string } = {}) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className={`input h-14 ${errors[k] ? "border-red-500" : ""}`} type={opts.type ?? "text"} placeholder={opts.ph} autoComplete={opts.auto} value={f[k]} onChange={set(k)} />
      {errors[k] ? <p className="text-red-600 text-[14px] mt-2">{errors[k]}</p> : opts.help && <p className="text-muted text-[14px] mt-2">{opts.help}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-6 mt-8 items-start" noValidate>
      <div className="card p-5 sm:p-7 space-y-6">
        <h2 className="text-[22px] font-semibold">{d.delivery_details}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {field("firstName", d.first_name, { auto: "given-name" })}
          {field("lastName", d.last_name, { auto: "family-name" })}
        </div>
        {field("phone", d.phone, { type: "tel", ph: `${country.dial} …`, help: d.phone_help, auto: "tel" })}
        {loyal.every > 0 && <p className="!mt-2 text-[14px] rounded-xl bg-paper border border-line px-3 py-2">🎁 {d.loyalty_progress.replace("{have}", String(loyal.have)).replace(/\{every\}/g, String(loyal.every))}</p>}
        {field("email", d.email, { type: "email", ph: lang === "sq" ? "emri@shembull.com" : "name@example.com", help: d.email_help, auto: "email" })}
        <div className="grid grid-cols-2 gap-4">
          <div><div className="label">{d.step_country}</div><div className="input h-14 flex items-center bg-paper text-muted truncate">{country.flag}&nbsp; {lang === "sq" ? country.sq : country.en}</div></div>
          <div><div className="label">{d.step_city}</div><div className="input h-14 flex items-center bg-paper text-muted"><span className="truncate">{draft.city}</span></div></div>
        </div>
        {field("address", d.address, { ph: d.address_ph, auto: "street-address" })}
        <div>
          <label className="label" htmlFor="notes">{d.notes}</label>
          <textarea id="notes" className="input h-24 py-3" value={f.notes} onChange={set("notes")} />
        </div>
        <div>
          <div className="label">{d.payment}</div>
          <div className="rounded-xl border border-ink ring-1 ring-ink p-4 flex gap-3">
            <span className="mt-1 w-5 h-5 rounded-full border-[6px] border-ink shrink-0" />
            <div><div className="font-semibold">{d.payment_cod}</div><p className="text-muted text-[14px]">{d.payment_cod_d}</p></div>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-[20px] font-semibold">{d.summary}</h2>
        <div className="mt-4 space-y-3">
          {cart.map((x, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-12 shrink-0"><CaseFrame model={x.phone ?? getPhone(x.phoneId)} image={x.previewUrl} material={x.finish} caseColor={x.caseColor} className="w-full h-auto" /></div>
              <div className="text-[14px] min-w-0">
                <div className="font-semibold">{(x.phone ?? getPhone(x.phoneId)).name} × {x.qty}</div>
                <div className="text-muted truncate">{x.materialName?.[lang]} · {x.custom ? d.personalised : x.designName ?? d.regular}</div>
              </div>
            </div>
          ))}
          <Link href={`/${lang}/cart`} className="underline text-[14px]">{d.change}</Link>
        </div>
        <div className="mt-5 pt-4 border-t border-line space-y-2 text-[15px]">
          <div className="flex justify-between"><span className="text-muted">{tot.count} {d.cases}</span><span>{fmt(tot.full)}</span></div>
          {tot.offer && <div className="flex justify-between text-brand font-medium"><span>{d.offer_box} {tot.offer.qty}</span><span>−{fmt(tot.discount)}</span></div>}
          {tot.codeDiscount > 0 && <div className="flex justify-between text-brand font-medium"><span>{useWelcome ? `${d.welcome_line} −${welcome}%` : `${d.discount_code} ${ex.code}`}</span><span>−{fmt(tot.codeDiscount)}</span></div>}
          {tot.loyaltyDiscount > 0 && <div className="flex justify-between text-brand font-medium"><span>🎁 {d.loyalty_line}</span><span>−{fmt(tot.loyaltyDiscount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">{d.shipping}</span><span>{tot.shipping === 0 ? d.free : fmt(tot.shipping)}</span></div>
          <div className="flex justify-between font-semibold text-[18px] pt-2"><span>{d.total}</span><span>{fmt(total)}</span></div>
        </div>
        {fail && <p className="text-red-600 text-[14px] mt-3">{d.order_error}</p>}
        <div className="hidden lg:block"><button disabled={busy} className="btn-dark w-full h-14 text-[16px] mt-5">{busy ? d.sending : `${d.order_now} · ${fmt(total)}`}</button></div>
      </div>

      <div className="lg:hidden sticky bottom-0 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-t border-line">
        {fail && <p className="text-red-600 text-[14px] mb-2">{d.order_error}</p>}
        <button disabled={busy} className="btn-dark w-full h-14 text-[16px]">{busy ? d.sending : `${d.order_now} · ${fmt(total)}`}</button>
      </div>
    </form>
  );
}
