"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CaseFrame from "./CaseFrame";
import { getPhone } from "@/lib/phones";
import { formatPrice } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";

export default function OrderDone({ lang, id }: { lang: Lang; id: string }) {
  const d = t(lang);
  const [o, setO] = useState<any>(null);
  useEffect(() => {
    try { const x = JSON.parse(sessionStorage.getItem("dax-last-order") || "null"); if (x?.id === id) setO(x); } catch {}
  }, [id]);
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-14 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-ink text-white grid place-items-center text-[28px]">✓</div>
      <h1 className="font-display text-[34px] sm:text-[42px] font-bold mt-6 leading-tight">{d.thanks}</h1>
      <p className="text-muted text-[17px] mt-3">{d.thanks_sub}</p>
      <div className="card mt-8 p-6 text-left">
        <div className="flex gap-5 items-center">
          {o && <div className="w-20 shrink-0"><CaseFrame model={o.phone ?? getPhone(o.phoneId)} image={o.previewUrl} material={o.material} caseColor={o.caseColor} className="w-full h-auto" /></div>}
          <div className="space-y-3 flex-1">
            <div><div className="text-[13px] text-muted">{d.order_no}</div><div className="text-[22px] font-semibold tracking-wide">{id}</div></div>
            {o && <div><div className="text-[13px] text-muted">{d.pay_on_delivery}</div><div className="text-[20px] font-semibold">{formatPrice(o.total, o.country, lang)}</div></div>}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/${lang}/track?n=${id}`} className="btn-dark">{d.track}</Link>
        <Link href={`/${lang}/create`} className="btn-light">{d.another}</Link>
        <Link href={`/${lang}`} className="btn-light">{d.back_home}</Link>
      </div>
    </div>
  );
}
