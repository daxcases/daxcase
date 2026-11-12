"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import CaseFrame from "./CaseFrame";
import { addDesign } from "@/app/admin/actions";
import { getPhone, DEFAULT_PHONE } from "@/lib/phones";

export default function AddDesignForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(addDesign, null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && "ok" in state) { formRef.current?.reset(); setPreview(null); } }, [state]);

  return (
    <form ref={formRef} action={action} className="card p-5 grid sm:grid-cols-[130px_1fr] gap-6">
      <div><CaseFrame model={getPhone(DEFAULT_PHONE)} image={preview} className="w-full h-auto" /></div>
      <div className="space-y-4">
        <h2 className="font-semibold text-[18px]">Add a new design</h2>
        <div>
          <label className="label">Image <span className="font-normal text-muted">(portrait, about 1200 × 2500 px, max 4 MB)</span></label>
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required
            className="block w-full text-[14px] file:mr-3 file:h-11 file:px-4 file:rounded-xl file:border-0 file:bg-ink file:text-white file:font-semibold"
            onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }} />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="kind" className="input">
            <option value="design">Design — fills the whole case</option>
            <option value="sticker">Sticker — small picture customers place on top (use a PNG with transparent background)</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input name="name" className="input" placeholder="e.g. Baby Blue Flag" required /></div>
          <div>
            <label className="label">Category</label>
            <select name="category_id" className="input">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" name="featured" className="w-4 h-4 accent-ink" /> Show first (featured)</label>
        {state && "error" in state && <p className="text-red-600 text-[14px]">{state.error}</p>}
        {state && "ok" in state && <p className="text-green-700 text-[14px]">Design added.</p>}
        <button disabled={pending} className="btn-dark">{pending ? "Uploading…" : "Add design"}</button>
      </div>
    </form>
  );
}
