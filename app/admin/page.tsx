import Link from "next/link";
import { sql } from "@/lib/db";
import { deleteOrder, requireAdmin } from "./actions";
import { CopyButton, DownloadButtons } from "@/components/OrderTools";
import ConfirmButton from "@/components/ConfirmButton";
import { ORDER_STATUSES, STATUS_STYLE, casesText, customerText } from "@/lib/orders";
import { formatPrice, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireAdmin();
  const { status } = await searchParams;
  const filter = status && ORDER_STATUSES.includes(status) ? status : null;
  const orders = await sql(
    `SELECT * FROM orders ${filter ? "WHERE status = $1" : ""} ORDER BY created_at DESC LIMIT 300`,
    filter ? [filter] : [],
  );
  const counts = await sql("SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status");
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const totalN = counts.reduce((a, c) => a + c.n, 0);

  return (
    <div>
      <h1 className="font-display text-[32px] font-bold">Orders</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {[["New", n("new")], ["In progress", n("confirmed") + n("printing")], ["Shipped", n("shipped")], ["All orders", totalN]].map(([l, v]) => (
          <div key={l} className="card p-4"><div className="text-[13px] text-muted">{l}</div><div className="text-[28px] font-semibold">{v}</div></div>
        ))}
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
        <Link href="/admin" className={!filter ? "chip-on" : "chip"}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`${filter === s ? "chip-on" : "chip"} capitalize`}>{s} ({n(s)})</Link>
        ))}
      </div>
      <div className="card mt-4 divide-y divide-line overflow-hidden">
        {orders.length === 0 && <p className="p-10 text-center text-muted">No orders yet. New orders will appear here.</p>}
        {orders.map((o) => {
          const it = o.items?.[0];
          const c = COUNTRIES.find((x) => x.code === o.country);
          return (
            <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-paper">
            <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 flex-1 min-w-[260px]">
                {it?.previewUrl && <img src={it.previewUrl} alt="" className="w-10 h-20 object-cover rounded-md border border-line bg-white" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{o.id}</span>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[o.status] ?? ""}`}>{o.status}</span>
                  </div>
                  <div className="text-[14px] truncate">{o.first_name} {o.last_name} · {o.phone}</div>
                  <div className="text-[13px] text-muted truncate">{c?.flag} {o.city} · {casesText(o)}{o.offer_label ? ` · ${o.offer_label}` : ""}{o.code ? ` · code ${o.code}` : ""}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{formatPrice(Number(o.total), o.country as CountryCode, "en")}</div>
                  <div className="text-[12px] text-muted">{new Date(o.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade" })}</div>
                </div>
              </Link>
              <div className="flex items-center gap-1.5 flex-wrap">
                <CopyButton text={customerText(o)} label="Copy details" />
                <DownloadButtons id={o.id} count={o.items?.length ?? 1} />
                {me.role === "admin" && (
                  <form action={deleteOrder}><input type="hidden" name="id" value={o.id} />
                    <ConfirmButton message={`Delete order ${o.id} permanently?`} className="chip h-9 text-[13px] text-red-600">Delete</ConfirmButton></form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
