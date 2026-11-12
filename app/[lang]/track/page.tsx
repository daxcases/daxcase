import type { Metadata } from "next";
import { sql } from "@/lib/db";
import { isLang, t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : "sq").track };
}

const STEPS = ["new", "confirmed", "printing", "shipped", "delivered"] as const;

// Customers check their order here with the order number. Only the status, the post code and
// what was ordered are shown, never the name, phone or address.
export default async function TrackPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ n?: string }> }) {
  const { lang: l } = await params;
  const lang: Lang = isLang(l) ? l : "sq";
  const d = t(lang);
  const raw = ((await searchParams).n ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const id = raw ? (raw.startsWith("DX") ? `DX-${raw.slice(2)}` : `DX-${raw}`) : "";
  let o: any = null;
  if (id) {
    [o] = await sql("SELECT id, status, tracking_code, created_at, items, city FROM orders WHERE id = $1", [id]);
    if (!o) await new Promise((r) => setTimeout(r, 500)); // slows down guessing
  }
  const label = (s: string) => (d as any)[`st_${s}`] as string;
  const at = o ? STEPS.indexOf(o.status) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-10">
      <h1 className="font-display text-[34px] sm:text-[44px] font-bold leading-tight">{d.track_title}</h1>
      <p className="text-muted text-[17px] mt-2">{d.track_sub}</p>
      <form className="mt-6 flex gap-2" action={`/${lang}/track`}>
        <input name="n" defaultValue={id} placeholder="DX-AB12CD" className="input h-14 uppercase" autoComplete="off" required />
        <button className="btn-dark h-14 px-7">{d.track_btn}</button>
      </form>

      {id && !o && <p className="mt-6 rounded-xl bg-red-100 text-red-800 px-4 py-3">{d.track_none}</p>}

      {o && (
        <div className="card mt-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><div className="text-[13px] text-muted">{d.order_no}</div><div className="text-[22px] font-semibold tracking-wide">{o.id}</div></div>
            <span className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ${o.status === "cancelled" ? "bg-neutral-200 text-neutral-600" : "bg-green-100 text-green-800"}`}>{label(o.status)}</span>
          </div>
          {o.status !== "cancelled" && (
            <ol className="mt-6 space-y-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-[12px] font-bold ${i <= at ? "bg-ink text-white" : "border border-line text-muted"}`}>{i <= at ? "✓" : i + 1}</span>
                    {i < STEPS.length - 1 && <span className={`w-0.5 h-7 ${i < at ? "bg-ink" : "bg-line"}`} />}
                  </div>
                  <span className={`pt-0.5 ${i === at ? "font-semibold" : i < at ? "" : "text-muted"}`}>{label(s)}</span>
                </li>
              ))}
            </ol>
          )}
          <dl className="mt-5 pt-5 border-t border-line grid grid-cols-2 gap-4 text-[15px]">
            {o.tracking_code && <div className="col-span-2"><dt className="text-[13px] text-muted">{d.post_code}</dt><dd className="text-[19px] font-semibold tracking-wide">{o.tracking_code}</dd></div>}
            <div><dt className="text-[13px] text-muted">{d.ordered_on}</dt><dd>{new Date(o.created_at).toLocaleDateString("de-DE", { timeZone: "Europe/Belgrade" })}</dd></div>
            <div><dt className="text-[13px] text-muted">{d.step_city}</dt><dd>{o.city}</dd></div>
            <div className="col-span-2 flex gap-2 flex-wrap">
              {(o.items ?? []).map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-line p-2 pr-3">
                  <img src={it.previewUrl} alt="" className="w-8 rounded-md" /><span className="text-[14px]">{it.phoneName} × {it.qty}</span>
                </div>
              ))}
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
