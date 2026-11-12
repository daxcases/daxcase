"use client";
import { useState } from "react";

/** Copies the customer's details so they can be pasted into the courier's form or a message. */
export function CopyButton({ text, label = "Copy", className = "chip h-9 text-[13px]" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} title={text}
      onClick={async (e) => {
        e.preventDefault(); e.stopPropagation();
        try { await navigator.clipboard.writeText(text); }
        catch {
          const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
        }
        setDone(true); setTimeout(() => setDone(false), 1500);
      }}>
      {done ? "Copied ✓" : label}
    </button>
  );
}

/** Downloads the customer's design as JPG (as stored) or PNG (converted in the browser). */
export function DownloadButtons({ id, index = 0, count = 1, className = "chip h-9 text-[13px]" }: { id: string; index?: number; count?: number; className?: string }) {
  const [busy, setBusy] = useState(false);
  const save = (blob: Blob, ext: string, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${name}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const get = async (format: "jpg" | "png") => {
    setBusy(true);
    try {
      // with several cases in one order, every design is downloaded, one file each
      for (let k = index; k < index + count; k++) {
      const src = await (await fetch(`/admin/orders/${id}/file?i=${k}`)).blob();
      const img = await createImageBitmap(src);
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      if (format === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0);
      const out = await new Promise<Blob | null>((r) => c.toBlob(r, format === "png" ? "image/png" : "image/jpeg", 0.95));
      if (out) save(out, format, count > 1 || index > 0 ? `${id}-${k + 1}` : id);
      if (count > 1) await new Promise((r) => setTimeout(r, 400));
      }
    } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" disabled={busy} className={className} onClick={() => get("jpg")}>↓ JPG</button>
      <button type="button" disabled={busy} className={className} onClick={() => get("png")}>↓ PNG</button>
    </span>
  );
}
