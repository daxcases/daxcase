import { getMaterials, getMaterialsOff, getPricing } from "@/lib/db";
import { deleteMaterial, requireOwner, toggleMaterial } from "../actions";
import { formatPrice } from "@/lib/config";
import AddMaterialForm from "@/components/AddMaterialForm";
import ConfirmButton from "@/components/ConfirmButton";

export default async function MaterialsAdmin() {
  await requireOwner();
  const [all, off, p] = await Promise.all([getMaterials(), getMaterialsOff(), getPricing()]);
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[32px] font-bold">Materials</h1>
      <p className="text-muted mt-1">Switch a material off to hide it from the shop, or add a new one. Prices can be changed later under Prices.</p>
      <div className="card mt-5 divide-y divide-line">
        {all.map((m) => {
          const on = !off.includes(m.id);
          return (
            <div key={m.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <div className={`flex-1 min-w-[200px] ${on ? "" : "opacity-50"}`}>
                <b>{m.sq}</b> <span className="text-muted">/ {m.en}</span>
                <div className="text-[13px] text-muted">{m.descSq}</div>
                <div className="text-[13px]">{formatPrice(p.KS.prices[m.id], "KS", "en")} · {formatPrice(p.AL.prices[m.id], "AL", "en")} · {formatPrice(p.MK.prices[m.id], "MK", "en")}</div>
              </div>
              {m.id.startsWith("m-") && (
                <form action={deleteMaterial}><input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message={`Delete ${m.en}?`} className="text-[13px] text-red-600 underline">Delete</ConfirmButton></form>
              )}
              <span className="text-[12px] text-muted w-6">{on ? "On" : "Off"}</span>
              <form action={toggleMaterial} className="flex"><input type="hidden" name="id" value={m.id} />
                <button className={on ? "switch-on" : "switch"} role="switch" aria-checked={on} aria-label={`${m.en}: ${on ? "on" : "off"}`} /></form>
            </div>
          );
        })}
      </div>
      <AddMaterialForm defaults={{ KS: p.KS.prices.soft, AL: p.AL.prices.soft, MK: p.MK.prices.soft }} />
    </div>
  );
}
