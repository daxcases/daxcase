"use client";
import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { STORE } from "@/lib/config";

type BIP = Event & { prompt: () => Promise<void> };

export default function InstallPrompt({ lang }: { lang: Lang }) {
  const d = t(lang);
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [evt, setEvt] = useState<BIP | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    let dismissed = false;
    try { dismissed = localStorage.getItem("install-dismissed") === "1"; } catch {}
    if (standalone || dismissed || !/Mobi|Android|iPhone/i.test(navigator.userAgent)) return;
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIP); setShow(true); };
    window.addEventListener("beforeinstallprompt", onBip);
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const timer = ios ? setTimeout(() => setShow(true), 4000) : undefined;
    return () => { window.removeEventListener("beforeinstallprompt", onBip); if (timer) clearTimeout(timer); };
  }, []);

  const dismiss = () => {
    setShow(false); setSheet(false);
    try { localStorage.setItem("install-dismissed", "1"); } catch {}
  };

  if (!show) return null;
  return (
    <>
      {!sheet && (
        <div className="fixed bottom-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink text-white pl-5 pr-2 h-14 shadow-2xl">
            <button
              className="flex items-center gap-2 font-semibold"
              onClick={async () => { if (evt) { await evt.prompt(); dismiss(); } else setSheet(true); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" /></svg>
              {d.install_app}
            </button>
            <button onClick={dismiss} aria-label="Close" className="w-10 h-10 grid place-items-center rounded-full hover:bg-white/10">✕</button>
          </div>
        </div>
      )}
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end" onClick={dismiss}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[22px] font-semibold">{d.install_title} {STORE.shortName}</h3>
                <p className="text-muted mt-1">{d.install_sub}</p>
              </div>
              <button onClick={dismiss} className="w-10 h-10 grid place-items-center" aria-label="Close">✕</button>
            </div>
            <div className="mt-5 space-y-3">
              <div className="card bg-paper p-4 flex gap-4 items-center">
                <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-white grid place-items-center font-bold">1</span>
                <div><b>{d.install_1_t}</b><p className="text-muted text-[14px]">{d.install_1_d} <span className="inline-block align-middle">⬆︎</span></p></div>
              </div>
              <div className="card bg-paper p-4 flex gap-4 items-center">
                <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-white grid place-items-center font-bold">2</span>
                <div><b>{d.install_2_t} <span className="text-red-700">Add to Home Screen</span></b><p className="text-muted text-[14px]">{d.install_2_d}</p></div>
              </div>
            </div>
            <button onClick={dismiss} className="btn-dark w-full mt-6 h-14">{d.got_it}</button>
          </div>
        </div>
      )}
    </>
  );
}
