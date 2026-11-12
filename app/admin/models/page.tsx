import { getAllPhones, getDisabledPhones } from "@/lib/db";
import AddPhoneForm from "@/components/AddPhoneForm";
import ConfirmButton from "@/components/ConfirmButton";
import { deletePhone, requireOwner, setBrandPhones, togglePhone } from "../actions";
import CaseFrame from "@/components/CaseFrame";

export default async function ModelsAdmin() {
  await requireOwner();
  const [off, PHONES] = await Promise.all([getDisabledPhones(), getAllPhones()]);
  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-[32px] font-bold">Phone models</h1>
      <p className="text-muted mt-1">Switch a model off to hide it from the shop, for example when you have no stock. {PHONES.length - off.length} of {PHONES.length} are on.</p>
      <AddPhoneForm />
      <div className="grid md:grid-cols-2 gap-5 mt-6 items-start">
        {(["apple", "samsung"] as const).map((brand) => (
          <div key={brand} className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-line bg-paper">
              <h2 className="font-semibold text-[17px] flex-1">{brand === "apple" ? "Apple" : "Samsung"}</h2>
              {[["1", "All on"], ["0", "All off"]].map(([v, l]) => (
                <form key={v} action={setBrandPhones}>
                  <input type="hidden" name="brand" value={brand} /><input type="hidden" name="on" value={v} />
                  <button className="h-8 px-3 text-[12px] rounded-lg border border-line bg-white hover:border-ink">{l}</button>
                </form>
              ))}
            </div>
            <div className="divide-y divide-line">
              {PHONES.filter((p) => p.brand === brand).map((p) => {
                const on = !off.includes(p.id);
                return (
                  <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`w-6 shrink-0 ${on ? "" : "opacity-40"}`}><CaseFrame model={p} background="#f1f1f2" caseColor="#2a2a2e" className="w-full h-auto" /></span>
                    <span className={`flex-1 text-[15px] font-medium ${on ? "" : "text-muted line-through"}`}>{p.name}</span>
                    <span className="text-[12px] text-muted w-6">{on ? "On" : "Off"}</span>
                    {p.id.startsWith("c-") && (
                      <form action={deletePhone}><input type="hidden" name="id" value={p.id} />
                        <ConfirmButton message={`Delete ${p.name}?`} className="text-[12px] text-red-600 underline">Delete</ConfirmButton></form>
                    )}
                    <form action={togglePhone} className="flex"><input type="hidden" name="id" value={p.id} />
                      <button className={on ? "switch-on" : "switch"} aria-label={`${p.name}: ${on ? "on" : "off"}`} role="switch" aria-checked={on} /></form>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
