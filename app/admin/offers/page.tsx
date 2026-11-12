import { getCodes, getOffers, getPricing } from "@/lib/db";
import { addCode, deleteCode, deleteOffer, requireOwner, saveOffer, toggleCode } from "../actions";
import { CURRENCY, fromPrice } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";
import ConfirmButton from "@/components/ConfirmButton";

export default async function OffersAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; codeSaved?: string; codeError?: string }> }) {
  await requireOwner();
  const { saved, error, codeSaved, codeError } = await searchParams;
  const [offers, pricing, codes] = await Promise.all([getOffers(), getPricing(), getCodes()]);
  const one = fromPrice(pricing, "KS");
  const head = (
    <div className="grid grid-cols-[70px_1fr_1fr_1fr_auto] gap-2 text-[12px] text-muted px-1">
      <span>Cases</span>{COUNTRIES.map((c) => <span key={c.code}>{c.flag} {CURRENCY[c.code].code}</span>)}<span className="w-[150px]" />
    </div>
  );
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[32px] font-bold">OFERTA BOX</h1>
      <p className="text-muted mt-1">
        Pack prices. The customer chooses a pack in the basket; once the basket holds that many cases, the pack price replaces the normal price of those cases.
        Personalised cases still add their extra, and shipping is added once. One case now costs {one} €.
      </p>
      {saved && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-100 text-red-800 px-4 py-3 text-[14px]">Cases must be between 2 and 12, and every price above 0.</p>}
      <div className="card p-4 mt-5 space-y-3">
        {head}
        {offers.length === 0 && <p className="text-muted text-center py-4">No offers. Add one below.</p>}
        {offers.map((o) => (
          <div key={o.id} className="flex gap-2 items-center">
            <form action={saveOffer} className="grid grid-cols-[70px_1fr_1fr_1fr_auto] gap-2 flex-1 items-center">
              <input type="hidden" name="id" value={o.id} />
              <input name="qty" type="number" min="2" max="12" defaultValue={o.qty} className="input h-11 px-2 text-center" />
              {COUNTRIES.map((c) => <input key={c.code} name={c.code} type="number" step="0.01" min="0" defaultValue={o.prices[c.code]} className="input h-11 px-3" />)}
              <button className="chip h-11">Save</button>
            </form>
            <form action={deleteOffer}><input type="hidden" name="id" value={o.id} />
              <ConfirmButton message={`Delete the offer for ${o.qty} cases?`} className="chip h-11 text-red-600">Delete</ConfirmButton></form>
          </div>
        ))}
      </div>
      <h2 className="font-semibold text-[18px] mt-8">Add an offer</h2>
      <div className="card p-4 mt-3 space-y-3">
        {head}
        <form action={saveOffer} className="grid grid-cols-[70px_1fr_1fr_1fr_auto] gap-2 items-center">
          <input name="qty" type="number" min="2" max="12" placeholder="5" required className="input h-11 px-2 text-center" />
          {COUNTRIES.map((c) => <input key={c.code} name={c.code} type="number" step="0.01" min="0" required placeholder={c.code === "KS" ? "45" : c.code === "AL" ? "4500" : "2800"} className="input h-11 px-3" />)}
          <button className="btn-dark h-11 w-[150px]">Add offer</button>
        </form>
      </div>

      <h1 id="codes" className="font-display text-[32px] font-bold mt-14 scroll-mt-24">Discount codes</h1>
      <p className="text-muted mt-1">Create a code, give it to your customers (for example on Instagram), and they type it in the basket for a percentage off the cases. Shipping is not discounted.</p>
      {codeSaved && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Code saved.</p>}
      {codeError && <p className="mt-4 rounded-xl bg-red-100 text-red-800 px-4 py-3 text-[14px]">The code needs at least 3 letters or numbers, and the percent must be between 1 and 100.</p>}
      <form action={addCode} className="card p-4 mt-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]"><label className="label">Code</label><input name="code" className="input uppercase" placeholder="DAX10" required /></div>
        <div className="w-28"><label className="label">Percent off</label><input name="percent" type="number" min="1" max="100" className="input" placeholder="10" required /></div>
        <button className="btn-dark">Add code</button>
      </form>
      <div className="card mt-4 divide-y divide-line">
        {codes.length === 0 && <p className="text-muted text-center p-6">No codes yet.</p>}
        {codes.map((c) => (
          <div key={c.code} className="px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className={`flex-1 min-w-[140px] ${c.active ? "" : "opacity-50"}`}><b className="text-[17px] tracking-wide">{c.code}</b><div className="text-[13px] text-muted">−{c.percent}% · used {c.used ?? 0} time{(c.used ?? 0) === 1 ? "" : "s"}</div></div>
            <form action={deleteCode}><input type="hidden" name="code" value={c.code} />
              <ConfirmButton message={`Delete the code ${c.code}?`} className="text-[13px] text-red-600 underline">Delete</ConfirmButton></form>
            <span className="text-[12px] text-muted w-6">{c.active ? "On" : "Off"}</span>
            <form action={toggleCode} className="flex"><input type="hidden" name="code" value={c.code} />
              <button className={c.active ? "switch-on" : "switch"} role="switch" aria-checked={c.active} aria-label={`${c.code}: ${c.active ? "on" : "off"}`} /></form>
          </div>
        ))}
      </div>
    </div>
  );
}
