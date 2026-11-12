"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import CaseFrame from "./CaseFrame";
import { addPhone } from "@/app/admin/actions";
import { CAMERA_STYLES, type CameraKind } from "@/lib/phones";

export default function AddPhoneForm() {
  const [state, action, pending] = useActionState(addPhone, null);
  const ref = useRef<HTMLFormElement>(null);
  const [f, setF] = useState({ brand: "apple", w: 78, h: 163, camera: "pro-plateau" as CameraKind });
  useEffect(() => { if (state && "ok" in state) ref.current?.reset(); }, [state]);
  const ok = f.w >= 55 && f.w <= 95 && f.h >= 120 && f.h <= 185;
  return (
    <form ref={ref} action={action} className="card p-5 mt-6 grid sm:grid-cols-[110px_1fr] gap-6">
      <div>{ok && <CaseFrame model={{ id: "new", name: "", brand: f.brand as "apple" | "samsung", w: f.w, h: f.h, r: f.brand === "apple" ? f.w * 0.16 : f.w * 0.13, camera: f.camera }} background="#f1f1f2" className="w-full h-auto" />}</div>
      <div>
        <h2 className="font-semibold text-[18px]">Add a new phone model</h2>
        <p className="text-muted text-[14px] mt-1">When a new phone comes out, add it here. Width and height are in the phone's official specs (in mm).</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div><label className="label">Model name</label><input name="name" className="input" placeholder="e.g. iPhone 19 Pro Max" required /></div>
          <div><label className="label">Brand</label>
            <select name="brand" className="input" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })}><option value="apple">Apple</option><option value="samsung">Samsung</option></select></div>
          <div><label className="label">Width (mm)</label><input name="w" type="number" step="0.1" className="input" value={f.w} onChange={(e) => setF({ ...f, w: Number(e.target.value) })} required /></div>
          <div><label className="label">Height (mm)</label><input name="h" type="number" step="0.1" className="input" value={f.h} onChange={(e) => setF({ ...f, h: Number(e.target.value) })} required /></div>
          <div className="sm:col-span-2"><label className="label">Camera style</label>
            <select name="camera" className="input" value={f.camera} onChange={(e) => setF({ ...f, camera: e.target.value as CameraKind })}>
              {CAMERA_STYLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></div>
        </div>
        {state && "error" in state && <p className="text-red-600 text-[14px] mt-3">{state.error}</p>}
        {state && "ok" in state && <p className="text-green-700 text-[14px] mt-3">Model added. It is now in the shop.</p>}
        <button disabled={pending} className="btn-dark mt-5">{pending ? "Adding…" : "Add model"}</button>
      </div>
    </form>
  );
}
