import { getAllPhones, getStock, sql } from "@/lib/db";
import { markDelivered, requireStaff, saveStock, saveTracking, shipSelected } from "../actions";
import { MATERIALS, CASE_COLORS, formatPrice, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";
import { customerText } from "@/lib/orders";
import { CopyButton, DownloadButtons } from "@/components/OrderTools";

function OrderInfo({ o }: { o: any }) {
  const items: any[] = o.items ?? [];
  const c = COUNTRIES.find((x) => x.code === o.country);
  return (
    <div className="flex gap-4 flex-1 min-w-[260px]">
      <div className="flex gap-1 shrink-0">
        {items.slice(0, 4).map((it, i) => <a key={i} href={it.printUrl} target="_blank" title="Open print file"><img src={it.previewUrl} alt="" className="w-12 rounded-lg border border-line bg-white" /></a>)}
      </div>
      <div className="text-[14px] min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><b className="text-[16px]">{o.id}</b><span className="text-muted capitalize">{o.status}</span></div>
        <div>{o.first_name} {o.last_name} · <a className="underline" href={`tel:${String(o.phone).replace(/[^\d+]/g, "")}`}>{o.phone}</a></div>
        <div className="text-muted">{c?.flag} {o.city} · {o.address}</div>
        {items.map((it, i) => (
          <div key={i} className="text-muted">{it.phoneName} · {it.materialName ?? MATERIALS.find((m) => m.id === it.material)?.en} · {CASE_COLORS.find((x) => x.id === it.caseColor)?.en} × {it.qty}</div>
        ))}
        <div><span className="text-muted">Collect:</span> <b>{formatPrice(Number(o.total), o.country as CountryCode, "en")}</b></div>
        <div className="mt-1.5 flex gap-1.5 flex-wrap"><CopyButton text={customerText(o)} label="Copy details" className="chip h-8 text-[12px] px-3" /><DownloadButtons id={o.id} count={items.length} className="chip h-8 text-[12px] px-3" /></div>
      </div>
    </div>
  );
}

export default async function ShippingDesk({ searchParams }: { searchParams: Promise<{ saved?: string; shipped?: string }> }) {
  await requireStaff();
  const { saved, shipped: shippedN } = await searchParams;
  const [PHONES, toShip, shipped, stock] = await Promise.all([
    getAllPhones(),
    sql("SELECT * FROM orders WHERE status IN ('new','confirmed','printing') ORDER BY created_at ASC"),
    sql("SELECT * FROM orders WHERE status = 'shipped' ORDER BY shipped_at DESC NULLS LAST, created_at DESC LIMIT 100"),
    getStock(),
  ]);
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-[32px] font-bold">Shipping & stock</h1>

      <h2 className="font-semibold text-[18px] mt-6">To ship ({toShip.length})</h2>
      <p className="text-muted text-[14px] mt-1">Tick the orders you are sending, type the post code next to each one, then press the button.</p>
      {shippedN && Number(shippedN) > 0 && <p className="mt-3 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">{Number(shippedN)} order(s) moved to shipped.</p>}
      <form action={shipSelected}>
        <div className="card mt-3 divide-y divide-line">
          {toShip.length === 0 && <p className="p-8 text-center text-muted">Nothing waiting to be shipped.</p>}
          {toShip.map((o) => (
            <label key={o.id} className="p-4 flex flex-wrap gap-4 items-center cursor-pointer has-[:checked]:bg-paper">
              <input type="checkbox" name="ids" value={o.id} className="w-6 h-6 accent-ink shrink-0" aria-label={`Ship ${o.id}`} />
              <OrderInfo o={o} />
              <span className="text-[12px] text-muted">Post code<input name={`tracking_${o.id}`} defaultValue={o.tracking_code ?? ""} placeholder="e.g. RR123456789XK" className="input h-11 w-44 text-[14px] text-ink px-3 block" /></span>
            </label>
          ))}
        </div>
        {toShip.length > 0 && <button className="btn-dark mt-4">Move ticked orders to shipped</button>}
      </form>

      <h2 className="font-semibold text-[18px] mt-10">Shipped ({shipped.length})</h2>
      <div className="card mt-3 divide-y divide-line">
        {shipped.length === 0 && <p className="p-8 text-center text-muted">No shipped orders yet.</p>}
        {shipped.map((o) => (
          <div key={o.id} className="p-4 flex flex-wrap gap-4 items-center">
            <OrderInfo o={o} />
            <div className="flex gap-2 items-end">
              <form action={saveTracking} className="flex gap-2 items-end">
                <input type="hidden" name="id" value={o.id} />
                <label className="text-[12px] text-muted">Post code<input name="tracking" defaultValue={o.tracking_code ?? ""} className="input h-11 w-44 text-[14px] text-ink px-3" /></label>
                <button className="chip h-11">Save</button>
              </form>
              <form action={markDelivered}><input type="hidden" name="id" value={o.id} /><button className="chip h-11">Delivered ✓</button></form>
            </div>
          </div>
        ))}
      </div>

      <h2 id="stock" className="font-semibold text-[18px] mt-10 scroll-mt-24">Case stock</h2>
      <p className="text-muted text-[14px] mt-1">How many blank cases you have for each model. Each order takes its cases from the stock, and a cancelled order puts them back. A model at 0 is hidden from the shop. Leave a field empty if you do not want to count that model.</p>
      {saved && <p className="mt-3 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Stock saved.</p>}
      <form action={saveStock} className="card p-5 mt-3">
        <div className="grid sm:grid-cols-2 gap-x-8">
          {(["apple", "samsung"] as const).map((brand) => (
            <div key={brand}>
              <h3 className="font-semibold mb-2 mt-2">{brand === "apple" ? "Apple" : "Samsung"}</h3>
              {PHONES.filter((p) => p.brand === brand).map((p) => {
                const n = stock[p.id];
                return (
                  <label key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className={`flex-1 text-[15px] ${n === 0 ? "text-red-600 font-medium" : ""}`}>{p.name}{n === 0 && " · out"}{typeof n === "number" && n > 0 && n <= 3 && <span className="text-amber-600"> · low</span>}</span>
                    <input name={`stock_${p.id}`} type="number" min="0" step="1" defaultValue={typeof n === "number" ? n : ""} placeholder="–" className="input h-10 w-20 text-center px-2" />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <button className="btn-dark mt-5">Save stock</button>
      </form>
    </div>
  );
}
