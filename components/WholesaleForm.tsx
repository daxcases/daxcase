"use client";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export default function WholesaleForm({ lang }: { lang: Lang }) {
  const d = t(lang);
  const [f, setF] = useState({ name: "", business: "", phone: "", qty: "", message: "" });
  const [state, setState] = useState<"" | "bad" | "busy" | "done">("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || f.phone.replace(/\D/g, "").length < 8) { setState("bad"); return; }
    setState("busy");
    try {
      const r = await fetch("/api/wholesale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      setState(r.ok ? "done" : "bad");
    } catch { setState("bad"); }
  };
  if (state === "done") return <p className="mt-8 rounded-2xl bg-green-100 text-green-800 px-5 py-4 text-[17px]">✓ {d.ws_done}</p>;
  return (
    <form onSubmit={submit} className="card p-5 sm:p-7 mt-8 space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div><label className="label">{d.ws_name}</label><input className="input h-14" value={f.name} onChange={set("name")} /></div>
        <div><label className="label">{d.phone}</label><input className="input h-14" type="tel" value={f.phone} onChange={set("phone")} /></div>
        <div><label className="label">{d.ws_business}</label><input className="input h-14" value={f.business} onChange={set("business")} /></div>
        <div><label className="label">{d.ws_qty}</label><input className="input h-14" type="number" min="20" placeholder="20" value={f.qty} onChange={set("qty")} /></div>
      </div>
      <div><label className="label">{d.ws_message}</label><textarea className="input h-28 py-3" value={f.message} onChange={set("message")} /></div>
      {state === "bad" && <p className="text-red-600 text-[14px]">{d.required} {d.invalid_phone}</p>}
      <button disabled={state === "busy"} className="btn-dark h-14 px-8">{d.ws_send}</button>
    </form>
  );
}
