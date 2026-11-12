import { getMarketing, getSubscribers, getWaitlist, getWholesale } from "@/lib/db";
import { deleteWait, deleteWholesale, requireOwner, updateMarketing } from "../actions";
import { CopyButton } from "@/components/OrderTools";
import ConfirmButton from "@/components/ConfirmButton";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/Belgrade" });

export default async function MarketingAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireOwner();
  const { saved } = await searchParams;
  const [m, subs, wait, bulk] = await Promise.all([getMarketing(), getSubscribers(), getWaitlist(), getWholesale()]);
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[32px] font-bold">Marketing</h1>
      {saved && <p className="mt-4 rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Saved.</p>}
      <form action={updateMarketing} className="card p-5 mt-5 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 flex-1 min-w-[240px]"><input type="checkbox" name="welcomeOn" defaultChecked={m.welcomeOn} className="w-5 h-5 accent-ink" />
            <span><b>Email pop-up with welcome discount</b><span className="block text-[13px] text-muted">New visitors leave their email and get the discount on their first order, automatically.</span></span></label>
          <label className="text-[13px] text-muted">Percent off<input name="welcomePercent" type="number" min="1" max="90" defaultValue={m.welcomePercent} className="input h-11 w-24 text-ink block" /></label>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-5 border-t border-line">
          <label className="flex items-center gap-3 flex-1 min-w-[240px]"><input type="checkbox" name="loyaltyOn" defaultChecked={m.loyaltyOn} className="w-5 h-5 accent-ink" />
            <span><b>Loyalty: every Nth case free</b><span className="block text-[13px] text-muted">Counted by the customer's phone number. The cheapest case in that order is free.</span></span></label>
          <label className="text-[13px] text-muted">Free case every<input name="loyaltyEvery" type="number" min="2" max="50" defaultValue={m.loyaltyEvery} className="input h-11 w-24 text-ink block" /></label>
        </div>
        <button className="btn-dark">Save</button>
      </form>

      <div className="flex items-center justify-between mt-10 gap-3">
        <h2 className="font-semibold text-[20px]">Email sign-ups ({subs.length})</h2>
        {subs.length > 0 && <CopyButton text={subs.map((s) => s.email).join("\n")} label="Copy all emails" />}
      </div>
      <div className="card mt-3 divide-y divide-line max-h-80 overflow-y-auto">
        {subs.length === 0 && <p className="p-6 text-center text-muted">No sign-ups yet.</p>}
        {[...subs].reverse().map((s) => (
          <div key={s.email} className="px-4 py-2.5 flex items-center gap-3 text-[14.5px]"><span className="flex-1 truncate">{s.email}</span>
            <span className="text-[12px] text-muted">{s.used ? "discount used" : "discount not used"} · {day(s.at)}</span></div>
        ))}
      </div>

      <h2 className="font-semibold text-[20px] mt-10">Waiting list for out-of-stock models ({wait.length})</h2>
      <div className="card mt-3 divide-y divide-line">
        {wait.length === 0 && <p className="p-6 text-center text-muted">Nobody is waiting.</p>}
        {wait.map((w) => (
          <div key={w.id} className="px-4 py-2.5 flex items-center gap-3 text-[14.5px]"><b className="flex-1">{w.model}</b><a className="underline" href={`tel:${w.contact.replace(/[^\d+]/g, "")}`}>{w.contact}</a>
            <span className="text-[12px] text-muted">{day(w.at)}</span>
            <form action={deleteWait}><input type="hidden" name="id" value={w.id} /><button className="text-[13px] text-red-600 underline">Done</button></form></div>
        ))}
      </div>

      <h2 className="font-semibold text-[20px] mt-10">Bulk order requests ({bulk.length})</h2>
      <div className="space-y-3 mt-3">
        {bulk.length === 0 && <p className="card p-6 text-center text-muted">No requests yet.</p>}
        {[...bulk].reverse().map((r) => (
          <div key={r.id} className="card p-4 text-[14.5px]">
            <div className="flex items-center gap-3 flex-wrap"><b className="flex-1">{r.name}{r.business ? ` · ${r.business}` : ""}</b><span className="text-[12px] text-muted">{day(r.at)}</span></div>
            <div><a className="underline" href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>{r.qty ? ` · ${r.qty} cases` : ""}</div>
            {r.message && <p className="text-muted mt-1 whitespace-pre-wrap">{r.message}</p>}
            <form action={deleteWholesale} className="mt-2"><input type="hidden" name="id" value={r.id} />
              <ConfirmButton message="Remove this request?" className="text-[13px] text-red-600 underline">Remove</ConfirmButton></form>
          </div>
        ))}
      </div>
    </div>
  );
}
