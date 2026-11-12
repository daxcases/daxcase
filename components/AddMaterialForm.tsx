"use client";
import { useActionState, useEffect, useRef } from "react";
import { addMaterial } from "@/app/admin/actions";

export default function AddMaterialForm({ defaults }: { defaults: { KS: number; AL: number; MK: number } }) {
  const [state, action, pending] = useActionState(addMaterial, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && "ok" in state) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card p-5 mt-6">
      <h2 className="font-semibold text-[18px]">Add a new material</h2>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div><label className="label">Name in Albanian</label><input name="sq" className="input" placeholder="p.sh. MagSafe" required /></div>
        <div><label className="label">Name in English</label><input name="en" className="input" placeholder="e.g. MagSafe" /></div>
        <div><label className="label">Short description (Albanian)</label><input name="descSq" className="input" placeholder="p.sh. Me magnet për karikim" /></div>
        <div><label className="label">Short description (English)</label><input name="descEn" className="input" placeholder="e.g. With magnet for charging" /></div>
        <div>
          <label className="label">Look in the preview</label>
          <select name="finish" className="input" defaultValue="glossy">
            <option value="glossy">Shiny</option><option value="matte">Matte</option><option value="soft">Soft</option><option value="tough">Thick edge</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="label">€ Kosovo</label><input name="price_KS" type="number" step="0.01" min="0" defaultValue={defaults.KS} className="input px-2" /></div>
          <div><label className="label">Lekë</label><input name="price_AL" type="number" min="0" defaultValue={defaults.AL} className="input px-2" /></div>
          <div><label className="label">Denarë</label><input name="price_MK" type="number" min="0" defaultValue={defaults.MK} className="input px-2" /></div>
        </div>
      </div>
      {state && "error" in state && <p className="text-red-600 text-[14px] mt-3">{state.error}</p>}
      {state && "ok" in state && <p className="text-green-700 text-[14px] mt-3">Material added. It is now in the shop.</p>}
      <button disabled={pending} className="btn-dark mt-5">{pending ? "Adding…" : "Add material"}</button>
    </form>
  );
}
