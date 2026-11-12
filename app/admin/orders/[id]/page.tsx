import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { deleteOrder, requireAdmin, setOrderStatus } from "../../actions";
import { ORDER_STATUSES, STATUS_STYLE, customerText } from "@/lib/orders";
import { CopyButton, DownloadButtons } from "@/components/OrderTools";
import { CASE_COLORS, MATERIALS, formatPrice, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";
import ConfirmButton from "@/components/ConfirmButton";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const [o] = await sql("SELECT * FROM orders WHERE id = $1", [id]);
  if (!o) notFound();
  const c = COUNTRIES.find((x) => x.code === o.country);
  const fmt = (n: number) => formatPrice(Number(n), o.country as CountryCode, "en");
  const tel = String(o.phone).replace(/[^\d+]/g, "");

  return (
    <div>
      <Link href="/admin" className="text-[14px] text-muted hover:text-ink">← All orders</Link>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <h1 className="font-display text-[32px] font-bold">{o.id}</h1>
        <span className={`text-[13px] px-3 py-1 rounded-full capitalize ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span>
        <span className="text-muted text-[14px]">{new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Europe/Belgrade" })}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 mt-6 items-start">
        <div className="space-y-5">
          {o.items.map((it: any, i: number) => (
            <div key={i} className="card p-5 flex gap-5 flex-wrap">
              <a href={it.previewUrl} target="_blank"><img src={it.previewUrl} alt="" className="w-32 rounded-xl border border-line" /></a>
              <div className="flex-1 min-w-[200px] space-y-1.5 text-[15px]">
                <div className="text-[19px] font-semibold">{it.phoneName}</div>
                <div><span className="text-muted">Material:</span> {it.materialName ?? MATERIALS.find((m) => m.id === it.material)?.en ?? it.material}</div>
                <div><span className="text-muted">Edge colour:</span> {CASE_COLORS.find((x) => x.id === it.caseColor)?.en}</div>
                <div><span className="text-muted">Quantity:</span> {it.qty} × {fmt(it.unitPrice)}</div>
                <div><span className="text-muted">Design:</span> {it.custom ? "Personalised" : "Regular"}{it.designName ? ` · ${it.designName}` : ""}</div>
                <div className="pt-3 flex items-center gap-2 flex-wrap"><span className="text-muted text-[13px]">Download design:</span><DownloadButtons id={o.id} index={i} className="btn-dark h-10 px-4 text-[14px]" /></div>
              </div>
            </div>
          ))}
          <div className="card p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-[18px]">Customer</h2><CopyButton text={customerText(o)} label="Copy details" /></div>
            <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[15px]">
              <div><dt className="text-muted text-[13px]">Name</dt><dd>{o.first_name} {o.last_name}</dd></div>
              <div><dt className="text-muted text-[13px]">Phone</dt><dd><a className="underline" href={`tel:${tel}`}>{o.phone}</a> · <a className="underline" target="_blank" href={`https://wa.me/${tel.replace("+", "")}`}>WhatsApp</a></dd></div>
              <div><dt className="text-muted text-[13px]">Country / city</dt><dd>{c?.flag} {c?.en} · {o.city}</dd></div>
              <div><dt className="text-muted text-[13px]">Address</dt><dd>{o.address}</dd></div>
              {o.email && <div><dt className="text-muted text-[13px]">Email</dt><dd><a className="underline" href={`mailto:${o.email}`}>{o.email}</a></dd></div>}
              <div><dt className="text-muted text-[13px]">Site language</dt><dd>{o.lang === "sq" ? "Albanian" : "English"}</dd></div>
              {o.notes && <div className="sm:col-span-2"><dt className="text-muted text-[13px]">Notes</dt><dd className="whitespace-pre-wrap">{o.notes}</dd></div>}
            </dl>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-semibold text-[18px]">Status</h2>
            {o.tracking_code && <p className="text-[14px] mt-1"><span className="text-muted">Post code:</span> <b>{o.tracking_code}</b></p>}
            <form action={setOrderStatus} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="id" value={o.id} />
              {ORDER_STATUSES.map((s) => (
                <button key={s} name="status" value={s} className={`${o.status === s ? "chip-on" : "chip"} justify-center capitalize`}>{s}</button>
              ))}
            </form>
          </div>
          <div className="card p-5 text-[15px] space-y-2">
            <h2 className="font-semibold text-[18px] mb-3">Payment · cash on delivery</h2>
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{fmt(o.subtotal)}</span></div>
            {o.offer_label && <div className="flex justify-between text-red-700"><span>{o.offer_label}</span><span>−{fmt(o.discount)}</span></div>}
            {o.code && <div className="flex justify-between text-red-700"><span>{o.code === "WELCOME" ? "Welcome discount" : `Code ${o.code}`}</span><span>−{fmt(o.code_discount)}</span></div>}
            {Number(o.loyalty_discount) > 0 && <div className="flex justify-between text-red-700"><span>Loyalty: free case</span><span>−{fmt(o.loyalty_discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{fmt(o.shipping)}</span></div>
            <div className="flex justify-between font-semibold text-[18px] pt-2 border-t border-line"><span>To collect</span><span>{fmt(o.total)}</span></div>
          </div>
          {me.role === "admin" && (
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={o.id} />
              <ConfirmButton message="Delete this order permanently?" className="text-[14px] text-red-600 underline">Delete order</ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
