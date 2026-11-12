"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WELCOME_KEY } from "./Wizard";
import { t, type Lang } from "@/lib/i18n";

/** Shown once to new visitors: leave your email, get the welcome discount applied automatically */
export default function WelcomePopup({ lang, percent }: { lang: Lang; percent: number }) {
  const d = t(lang);
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"" | "bad" | "busy" | "done">("");

  useEffect(() => {
    if (/\/(checkout|order|create)/.test(path)) return;
    let skip = false;
    try { skip = !!localStorage.getItem(WELCOME_KEY) || localStorage.getItem("dax-welcome-no") === "1"; } catch {}
    if (skip) return;
    const id = setTimeout(() => setOpen(true), 6000);
    return () => clearTimeout(id);
  }, [path]);

  const close = () => { setOpen(false); try { if (state !== "done") localStorage.setItem("dax-welcome-no", "1"); } catch {} };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setState("bad"); return; }
    setState("busy");
    try {
      const r = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      if (!r.ok) throw new Error();
      localStorage.setItem(WELCOME_KEY, email.trim().toLowerCase());
      setState("done");
    } catch { setState("bad"); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={close}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-7 relative" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button onClick={close} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full hover:bg-paper">✕</button>
        <div className="inline-block rounded-full bg-brand px-3 py-1 text-[13px] font-bold" style={{ color: "#fff" }}>−{percent}%</div>
        <h2 className="font-display text-[32px] font-bold mt-3 leading-tight">{d.welcome_title.replace("{p}", String(percent))}</h2>
        {state === "done" ? (
          <>
            <p className="text-[17px] mt-3">✓ {d.welcome_done.replace("{p}", String(percent))}</p>
            <button onClick={close} className="btn-dark w-full mt-6 h-14">{d.continue}</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="text-muted mt-2">{d.welcome_text}</p>
            <input type="email" className="input h-14 mt-5" placeholder={lang === "sq" ? "emri@shembull.com" : "name@example.com"} value={email} onChange={(e) => { setEmail(e.target.value); setState(""); }} autoComplete="email" />
            {state === "bad" && <p className="text-red-600 text-[14px] mt-2">{d.email_invalid}</p>}
            <button disabled={state === "busy"} className="btn-dark w-full mt-4 h-14">{d.welcome_btn}</button>
            <button type="button" onClick={close} className="block mx-auto mt-4 text-[14px] text-muted underline">{d.welcome_no}</button>
          </form>
        )}
      </div>
    </div>
  );
}
