"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Canvas as FCanvas, FabricObject, IText as FIText } from "fabric";
import CaseFrame, { rimFor } from "./CaseFrame";
import type { PhoneModel } from "@/lib/phones";
import type { MaterialId } from "@/lib/config";
import { t, type Lang } from "@/lib/i18n";
import { EMOJIS } from "@/lib/emojis";

export type Tool = "photo" | "text" | "emoji" | "bg" | "sticker" | "tpl";
export type Sticker = { id: number; name: string; image_url: string };
export type EditorHandle = {
  exportPrint: () => Promise<Blob>;
  exportPreview: () => string;
  isEmpty: () => boolean;
  /** true when the customer added their own photo, text, emoji or colour */
  isCustom: () => boolean;
  openTool: (t: Tool) => void;
  getJSON: () => unknown;
};

export const FONTS = [
  { name: "Inter", css: "Inter" },
  { name: "Archivo", css: "Archivo Black" },
  { name: "Bebas", css: "Bebas Neue" },
  { name: "Playfair", css: "Playfair Display" },
  { name: "Pacifico", css: "Pacifico" },
  { name: "Caveat", css: "Caveat" },
  { name: "Marker", css: "Permanent Marker" },
  { name: "Gothic", css: "UnifrakturCook" },
  { name: "Mono", css: "Space Mono" },
];
export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bebas+Neue&family=Playfair+Display:wght@700&family=Pacifico&family=Caveat:wght@700&family=Permanent+Marker&family=UnifrakturCook:wght@700&family=Space+Mono:wght@700&display=swap";

const COLORS = ["#ffffff", "#111113", "#e11d2e", "#1d4ed8", "#f5c400", "#16a34a", "#ec4899", "#f97316", "#7c3aed", "#9ca3af"];
const BG_COLORS = ["#ffffff", "#111113", "#f4f1ea", "#e11d2e", "#1d3f8f", "#f6d5dd", "#cfe8d7", "#ffe08a", "#c7d2fe", "#6b7280"];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

type Props = {
  lang: Lang;
  model: PhoneModel;
  material: MaterialId;
  caseColor: string;
  designUrl?: string | null;
  initialTool?: Tool | null;
  hidden?: boolean;
  stickers?: Sticker[];
};

async function fileToDataUrl(file: File, max = 2400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const png = file.type === "image/png" || file.type === "image/webp";
    return c.toDataURL(png ? "image/png" : "image/jpeg", 0.92);
  } finally { URL.revokeObjectURL(url); }
}

const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { lang, model, material, caseColor, designUrl, initialTool, hidden, stickers = [] }, ref,
) {
  const d = t(lang);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fc = useRef<FCanvas | null>(null);
  const fab = useRef<typeof import("fabric") | null>(null);
  const size = useRef({ w: 0, h: 0, s: 1 });
  const fileRef = useRef<HTMLInputElement>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool | null>(initialTool ?? null);
  const [sel, setSel] = useState<FabricObject | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  const [bg, setBg] = useState("#ffffff");
  const [count, setCount] = useState(0);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  // ── geometry ──────────────────────────────────────────────
  const computeSize = useCallback(() => {
    const el = wrapRef.current;
    if (!el || el.clientWidth === 0) return null;
    const maxH = Math.min(window.innerHeight * 0.6, 580);
    const s = Math.min(maxH / model.h, (el.clientWidth * 0.82) / model.w);
    return { w: Math.round(model.w * s), h: Math.round(model.h * s), s };
  }, [model]);

  const innerRect = useCallback(() => {
    const { s } = size.current;
    const e = rimFor(material);
    return { x: e * s, y: e * s, w: (model.w - 2 * e) * s, h: (model.h - 2 * e) * s, r: (model.r - e) * s };
  }, [model, material]);

  const coverObject = useCallback((o: FabricObject) => {
    const { w, h } = size.current;
    const k = Math.max(w / (o.width || 1), h / (o.height || 1));
    o.set({ scaleX: k, scaleY: k, left: w / 2, top: h / 2, angle: 0 });
    o.setCoords();
  }, []);

  const applyClip = useCallback(() => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    const r = innerRect();
    c.clipPath = new F.Rect({ left: r.x + r.w / 2, top: r.y + r.h / 2, width: r.w, height: r.h, rx: r.r, ry: r.r, absolutePositioned: true });
  }, [innerRect]);

  const resize = useCallback(() => {
    const c = fc.current;
    const next = computeSize();
    if (!c || !next) return;
    const prev = size.current;
    if (prev.w === next.w && prev.h === next.h) { applyClip(); c.requestRenderAll(); return; }
    c.setDimensions({ width: next.w, height: next.h });
    if (prev.w > 0) {
      const kx = next.w / prev.w, ky = next.h / prev.h;
      c.getObjects().forEach((o) => {
        if ((o as any).isBg) return;
        o.set({ left: (o.left ?? 0) * kx, top: (o.top ?? 0) * ky, scaleX: (o.scaleX ?? 1) * kx, scaleY: (o.scaleY ?? 1) * kx });
        o.setCoords();
      });
    }
    size.current = next;
    setDim({ w: next.w, h: next.h });
    c.getObjects().forEach((o) => { if ((o as any).isBg) coverObject(o); });
    applyClip();
    c.requestRenderAll();
  }, [computeSize, applyClip, coverObject]);

  // ── init fabric ───────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    (async () => {
      const F = await import("fabric");
      if (disposed || !canvasEl.current) return;
      fab.current = F;
      const s0 = computeSize() ?? { w: 300, h: 620, s: 1 };
      const c = new F.Canvas(canvasEl.current, {
        width: s0.w, height: s0.h, backgroundColor: "#ffffff", preserveObjectStacking: true,
        selectionColor: "rgba(0,0,0,0.04)", controlsAboveOverlay: true,
      });
      size.current = s0;
      setDim({ w: s0.w, h: s0.h });
      F.InteractiveFabricObject.ownDefaults = {
        ...F.InteractiveFabricObject.ownDefaults,
        cornerStyle: "circle", cornerColor: "#ffffff", cornerStrokeColor: "#111113", transparentCorners: false,
        borderColor: "#111113", cornerSize: 16, touchCornerSize: 32, padding: 4, borderScaleFactor: 1.5,
      };
      fc.current = c;
      applyClip();
      const update = () => { setSel(c.getActiveObject() ?? null); setCount(c.getObjects().length); rerender(); };
      c.on("selection:created", update); c.on("selection:updated", update); c.on("selection:cleared", update);
      c.on("object:added", update); c.on("object:removed", update); c.on("object:modified", update);
      // overlay goes between the drawing and the selection handles
      const host = document.createElement("div");
      host.style.cssText = "position:absolute;inset:0;pointer-events:none";
      c.wrapperEl.insertBefore(host, c.upperCanvasEl);
      setOverlayHost(host);
      setReady(true);
    })();
    return () => { disposed = true; fc.current?.dispose(); fc.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (ready) resize(); }, [ready, model, material, resize]);
  useEffect(() => {
    if (!ready) return;
    const ro = new ResizeObserver(() => resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [ready, resize]);
  useEffect(() => { if (!hidden && ready) requestAnimationFrame(() => resize()); }, [hidden, ready, resize]);

  // background design from catalog
  useEffect(() => {
    const c = fc.current, F = fab.current;
    if (!ready || !c || !F) return;
    c.getObjects().filter((o) => (o as any).isBg).forEach((o) => c.remove(o));
    if (!designUrl) { c.requestRenderAll(); return; }
    F.FabricImage.fromURL(designUrl, { crossOrigin: "anonymous" }).then((img) => {
      (img as any).isBg = true;
      coverObject(img);
      c.add(img);
      c.sendObjectToBack(img);
      c.requestRenderAll();
    });
  }, [designUrl, ready, coverObject]);

  // ── actions ───────────────────────────────────────────────
  const addPhoto = async (file: File) => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    const url = await fileToDataUrl(file);
    const img = await F.FabricImage.fromURL(url);
    const photos = c.getObjects().filter((o) => o.type === "image" && !(o as any).isBg).length;
    const hasBg = c.getObjects().some((o) => (o as any).isBg);
    if (photos === 0 && !hasBg) coverObject(img);
    else {
      const k = (size.current.w * 0.6) / (img.width || 1);
      img.set({ scaleX: k, scaleY: k, left: size.current.w / 2, top: size.current.h * 0.55 });
    }
    c.add(img); c.setActiveObject(img); c.requestRenderAll();
  };

  const loadFont = async (family: string) => {
    try { await document.fonts.load(`700 40px "${family}"`); } catch {}
    fab.current?.cache.clearFontCache(family);
  };

  const addText = async () => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    await loadFont("Inter");
    const dark = ["#111113", "#1d3f8f", "#e11d2e", "#6b7280"].includes(bg) || c.getObjects().some((o) => (o as any).isBg);
    const txt = new F.IText(lang === "sq" ? "Emri yt" : "Your name", {
      left: size.current.w / 2, top: size.current.h * 0.62, fontFamily: "Inter", fontWeight: 700,
      fontSize: size.current.w * 0.13, fill: dark ? "#ffffff" : "#111113", textAlign: "center",
    });
    c.add(txt); c.setActiveObject(txt); c.requestRenderAll();
  };

  // ── stickers (uploaded by the owner) ──
  const addSticker = async (url: string) => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    const img = await F.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    const k = (size.current.w * 0.38) / (img.width || 1);
    const n = c.getObjects().length;
    img.set({ scaleX: k, scaleY: k, left: size.current.w * (0.35 + ((n * 0.17) % 0.35)), top: size.current.h * (0.45 + ((n * 0.09) % 0.3)) });
    c.add(img); c.setActiveObject(img); c.requestRenderAll();
  };

  // ── text effects ──
  const applyArc = (o: FIText, on: boolean) => {
    const F = fab.current; if (!F) return;
    o.set({ path: undefined }); o.initDimensions();
    if (on) {
      const w = Math.max(40, o.width || 40), R = w * 0.62;
      o.set({ path: new F.Path(`M 0 0 A ${R} ${R} 0 0 1 ${w} 0`, { visible: false, strokeWidth: 0, fill: "" }), pathAlign: "center" });
      o.initDimensions();
    }
    (o as any).isArc = on;
    o.setCoords(); fc.current?.requestRenderAll(); rerender();
  };
  const toggleOutline = (o: FIText) => {
    const on = !o.stroke;
    const light = String(o.fill).toLowerCase() === "#ffffff";
    o.set(on ? { stroke: light ? "#111113" : "#ffffff", strokeWidth: (o.fontSize || 40) * 0.07, paintFirst: "stroke", strokeLineJoin: "round" } : { stroke: null as any, strokeWidth: 0 });
    o.initDimensions(); o.setCoords(); fc.current?.requestRenderAll(); rerender();
  };
  const toggleShadow = (o: FIText) => {
    const F = fab.current; if (!F) return;
    o.set({ shadow: o.shadow ? null : new F.Shadow({ color: "rgba(0,0,0,.55)", blur: 8, offsetX: 3, offsetY: 4 }) });
    fc.current?.requestRenderAll(); rerender();
  };

  // ── ready-made styles for a name and a number ──
  const [tplName, setTplName] = useState("");
  const [tplNum, setTplNum] = useState("");
  const addTemplate = async (kind: "vertical" | "jersey" | "plate" | "heart") => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    const W = size.current.w, H = size.current.h;
    const name = (tplName.trim() || (lang === "sq" ? "EMRI" : "NAME")), num = tplNum.trim() || "10";
    const dark = bg !== "#ffffff" || c.getObjects().some((o) => (o as any).isBg);
    const ink = dark ? "#ffffff" : "#111113";
    const added: FabricObject[] = [];
    const T = (text: string, font: string, sizePx: number, opts: Record<string, unknown> = {}) =>
      new F.IText(text, { fontFamily: font, fontWeight: 700, fontSize: sizePx, fill: ink, textAlign: "center", left: W / 2, top: H / 2, ...opts });
    if (kind === "vertical") {
      await loadFont("Bebas Neue");
      const t = T(name.toUpperCase(), "Bebas Neue", W * 0.3, { angle: -90, left: W * 0.72, top: H * 0.6, charSpacing: 60 });
      const maxLen = H * 0.62; if ((t.width || 0) > maxLen) t.scale(maxLen / (t.width || 1));
      added.push(t);
    }
    if (kind === "jersey") {
      await loadFont("Bebas Neue");
      const n = T(num, "Bebas Neue", W * 0.62, { top: H * 0.66 });
      const t = T(name.toUpperCase(), "Bebas Neue", W * 0.17, { top: H * 0.45, charSpacing: 80 });
      if ((t.width || 0) > W * 0.8) t.scale((W * 0.8) / (t.width || 1));
      added.push(t, n);
    }
    if (kind === "heart") {
      await loadFont("Pacifico");
      const t = T(name, "Pacifico", W * 0.17, { top: H * 0.6, fontWeight: 400 });
      if ((t.width || 0) > W * 0.8) t.scale((W * 0.8) / (t.width || 1));
      const h = new F.IText("❤️", { fontFamily: EMOJI_FONT, fontSize: W * 0.16, left: W / 2, top: H * 0.72, editable: false });
      (h as any).isEmoji = true;
      added.push(t, h);
    }
    if (kind === "plate") {
      await loadFont("Space Mono");
      const pw = W * 0.82, ph = pw * 0.24;
      const txt = new F.FabricText(`${num} · ${name.toUpperCase().slice(0, 8)}`, { fontFamily: "Space Mono", fontWeight: 700, fontSize: ph * 0.5, fill: "#111113", left: ph * 0.35, top: 0 });
      if ((txt.width || 0) > pw * 0.72) txt.scale((pw * 0.72) / (txt.width || 1));
      const plate = new F.Group([
        new F.Rect({ width: pw, height: ph, rx: ph * 0.14, ry: ph * 0.14, fill: "#ffffff", stroke: "#111113", strokeWidth: 2, left: 0, top: 0 }),
        new F.Rect({ width: ph * 0.62, height: ph - 6, rx: ph * 0.1, ry: ph * 0.1, fill: "#1d3f8f", left: -pw / 2 + ph * 0.31 + 3, top: 0 }),
        new F.FabricText("RKS", { fontFamily: "Inter", fontWeight: 700, fontSize: ph * 0.2, fill: "#ffffff", left: -pw / 2 + ph * 0.31 + 3, top: ph * 0.2 }),
        txt,
      ], { left: W / 2, top: H * 0.62 });
      added.push(plate);
    }
    added.forEach((o) => c.add(o));
    c.setActiveObject(added[0]); c.requestRenderAll();
  };

  const addEmoji = (e: string) => {
    const c = fc.current, F = fab.current;
    if (!c || !F) return;
    const n = c.getObjects().length;
    const em = new F.IText(e, {
      left: size.current.w * (0.35 + ((n * 0.17) % 0.4)), top: size.current.h * (0.36 + ((n * 0.07) % 0.2)),
      fontFamily: EMOJI_FONT, fontSize: size.current.w * 0.26, editable: false,
    });
    (em as any).isEmoji = true;
    c.add(em); c.setActiveObject(em); c.requestRenderAll();
  };

  const setBackground = (color: string) => {
    const c = fc.current; if (!c) return;
    c.backgroundColor = color; setBg(color); c.requestRenderAll();
  };

  const act = (a: "delete" | "dup" | "front" | "back" | "center" | "flip") => {
    const c = fc.current; const o = c?.getActiveObject();
    if (!c || !o) return;
    if (a === "delete") { c.remove(o); c.discardActiveObject(); }
    if (a === "dup") o.clone().then((cl: FabricObject) => {
      cl.set({ left: (o.left ?? 0) + 18, top: (o.top ?? 0) + 18 });
      (cl as any).isEmoji = (o as any).isEmoji;
      c.add(cl); c.setActiveObject(cl); c.requestRenderAll();
    });
    if (a === "front") c.bringObjectForward(o);
    if (a === "back") c.sendObjectBackwards(o);
    if (a === "center") { c.centerObject(o); o.setCoords(); }
    if (a === "flip") o.set("flipX", !o.flipX);
    c.requestRenderAll(); rerender();
  };

  const setProp = (props: Record<string, unknown>) => {
    const c = fc.current; const o = c?.getActiveObject();
    if (!c || !o) return;
    o.set(props);
    if ("fontFamily" in props || "text" in props || "fontWeight" in props) {
      if ((o as any).isArc) applyArc(o as FIText, true); else (o as FIText).initDimensions?.();
    }
    o.setCoords(); c.requestRenderAll(); rerender();
  };

  const reset = () => {
    const c = fc.current; if (!c) return;
    c.getObjects().filter((o) => !(o as any).isBg).forEach((o) => c.remove(o));
    setBackground("#ffffff"); c.discardActiveObject(); c.requestRenderAll();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const o = fc.current?.getActiveObject() as FIText | undefined;
      if (!o || (o as any).isEditing || hidden) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); act("delete"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useImperativeHandle(ref, () => ({
    openTool: (x) => { setTool(x); if (x === "photo") setTimeout(() => fileRef.current?.click(), 50); if (x === "text") addText(); },
    isEmpty: () => {
      const c = fc.current; if (!c) return true;
      return c.getObjects().length === 0 && (c.backgroundColor === "#ffffff" || !c.backgroundColor);
    },
    isCustom: () => {
      const c = fc.current; if (!c) return true;
      const hasDesign = c.getObjects().some((o) => (o as any).isBg);
      return !hasDesign || c.getObjects().some((o) => !(o as any).isBg);
    },
    exportPreview: () => {
      const c = fc.current!; c.discardActiveObject(); c.renderAll();
      const r = innerRect();
      return c.toDataURL({ format: "jpeg", quality: 0.9, multiplier: 600 / size.current.w, left: r.x, top: r.y, width: r.w, height: r.h });
    },
    exportPrint: async () => {
      const c = fc.current!; c.discardActiveObject();
      const clip = c.clipPath; c.clipPath = undefined; c.renderAll();
      // full case outline incl. bleed, ~1400px wide (≈ 450 dpi on a 78 mm case)
      const url = c.toDataURL({ format: "jpeg", quality: 0.92, multiplier: 1400 / size.current.w });
      c.clipPath = clip; c.renderAll();
      return await (await fetch(url)).blob();
    },
    getJSON: () => ({ ...(fc.current?.toObject(["isBg", "isEmoji", "isArc"]) ?? {}), canvasSize: size.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [innerRect, bg, lang]);

  // ── UI ────────────────────────────────────────────────────
  const isText = sel && (sel.type === "i-text" || sel.type === "text") && !(sel as any).isEmoji;
  const scaleBase = useRef(new WeakMap<object, number>());
  const sizeValue = () => {
    if (!sel) return 100;
    if (!scaleBase.current.has(sel)) scaleBase.current.set(sel, sel.scaleX || 1);
    return Math.round(((sel.scaleX || 1) / scaleBase.current.get(sel)!) * 100);
  };

  const tabs: [Tool, string, React.ReactNode][] = [
    ["photo", d.ed_photo, <path key="p" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2 1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />],
    ["text", d.ed_text, <path key="t" d="M5 6V4h14v2M12 4v16m-3 0h6" />],
    ["emoji", d.ed_emoji, <g key="e"><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01" /></g>],
    ["bg", d.ed_bg, <g key="b"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 15l16-11" /></g>],
    ["sticker", d.ed_stickers, <path key="s" d="M14 3H7a4 4 0 00-4 4v10a4 4 0 004 4h10a4 4 0 004-4v-7m-7-7 7 7m-7-7v4a3 3 0 003 3h4" />],
    ["tpl", d.ed_templates, <path key="x" d="M4 5h16M4 5v14h16V5M8 10h8M8 14h5" />],
  ];

  return (
    <div className={hidden ? "hidden" : ""}>
      <div ref={wrapRef} className="relative w-full flex justify-center py-4 select-none">
        <div className="relative case-shadow" style={{ width: dim.w || undefined, height: dim.h || undefined }}>
          <canvas ref={canvasEl} />
        </div>
        {count === 0 && !designUrl && bg === "#ffffff" && ready && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <p className="max-w-[180px] text-center text-[14px] text-muted mt-16">{d.ed_empty}</p>
          </div>
        )}
      </div>
      {overlayHost && dim.w > 0 && createPortal(
        <CaseFrame model={model} material={material} caseColor={caseColor} overlay style={{ width: dim.w, height: dim.h, display: "block" }} />,
        overlayHost,
      )}

      {/* selected object toolbar */}
      {sel && (
        <div className="card p-3 mb-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {([["delete", d.ed_delete, "M6 7h12M9 7V4h6v3m-7 4v6m4-6v6m4-10l-1 13H8L7 7"], ["dup", d.ed_duplicate, "M8 8h11v11H8zM5 16V5h11"], ["front", d.ed_front, "M12 19V5m0 0-5 5m5-5 5 5"], ["back", d.ed_backward, "M12 5v14m0 0-5-5m5 5 5-5"], ["center", d.ed_center, "M12 3v4m0 10v4M3 12h4m10 0h4M9 9h6v6H9z"], ["flip", d.ed_flip, "M12 3v18M8 7l-5 5 5 5M16 7l5 5-5 5"]] as const).map(([a, label, p]) => (
              <button key={a} onClick={() => act(a)} className="flex flex-col items-center gap-1 min-w-[64px] py-1.5 rounded-lg hover:bg-paper text-[12px]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={p} /></svg>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3 px-1">
            <label className="text-[12px] text-muted">{d.ed_size}
              <input type="range" min={10} max={400} value={sizeValue()} className="w-full accent-ink"
                onChange={(e) => {
                  const base = scaleBase.current.get(sel) ?? (sel.scaleX || 1);
                  const k = (base * Number(e.target.value)) / 100;
                  setProp({ scaleX: sel.flipX ? k : k, scaleY: k });
                }} />
            </label>
            <label className="text-[12px] text-muted">{d.ed_rotate}
              <input type="range" min={-180} max={180} value={Math.round(((sel.angle ?? 0) + 180) % 360 - 180)} className="w-full accent-ink"
                onChange={(e) => { sel.rotate(Number(e.target.value)); setProp({}); }} />
            </label>
          </div>
          {isText && (
            <div className="mt-3 space-y-3 px-1">
              <input className="input" value={(sel as FIText).text} onChange={(e) => setProp({ text: e.target.value })} placeholder={d.ed_text_placeholder} />
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {FONTS.map((f) => (
                  <button key={f.css} onClick={async () => { await loadFont(f.css); setProp({ fontFamily: f.css }); }}
                    className={(sel as FIText).fontFamily === f.css ? "chip-on" : "chip"} style={{ fontFamily: f.css }}>{f.name}</button>
                ))}
                <button onClick={() => setProp({ fontWeight: (sel as FIText).fontWeight === 700 ? 400 : 700 })} className="chip font-bold">B</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => toggleOutline(sel as FIText)} className={(sel as FIText).stroke ? "chip-on" : "chip"}>{d.ed_outline}</button>
                <button onClick={() => toggleShadow(sel as FIText)} className={(sel as FIText).shadow ? "chip-on" : "chip"}>{d.ed_shadow}</button>
                <button onClick={() => applyArc(sel as FIText, !(sel as any).isArc)} className={(sel as any).isArc ? "chip-on" : "chip"}>⌒ {d.ed_arc}</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((col) => (
                  <button key={col} onClick={() => setProp({ fill: col })} aria-label={col}
                    className={`w-8 h-8 rounded-full border ${(sel as FIText).fill === col ? "ring-2 ring-offset-2 ring-ink" : "border-line"}`} style={{ background: col }} />
                ))}
                <input type="color" className="w-8 h-8 rounded-full overflow-hidden border border-line" onChange={(e) => setProp({ fill: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* tools */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {tabs.map(([k, label, icon]) => (
          <button key={k} onClick={() => {
            setTool(k);
            if (k === "photo") fileRef.current?.click();
            if (k === "text") addText();
          }} className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 text-[13px] font-medium transition ${tool === k ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            {label}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = ""; }} />

      {tool === "emoji" && (
        <div className="card mt-3 p-3 max-h-64 overflow-y-auto grid grid-cols-8 sm:grid-cols-10 gap-1">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => addEmoji(e)} className="text-[26px] h-11 rounded-lg hover:bg-paper" style={{ fontFamily: EMOJI_FONT }}>{e}</button>
          ))}
        </div>
      )}
      {tool === "bg" && (
        <div className="card mt-3 p-4 flex gap-2 flex-wrap">
          {BG_COLORS.map((col) => (
            <button key={col} onClick={() => setBackground(col)} aria-label={col}
              className={`w-10 h-10 rounded-xl border ${bg === col ? "ring-2 ring-offset-2 ring-ink" : "border-line"}`} style={{ background: col }} />
          ))}
          <input type="color" value={bg} className="w-10 h-10 rounded-xl overflow-hidden border border-line" onChange={(e) => setBackground(e.target.value)} />
        </div>
      )}
      {tool === "sticker" && (
        <div className="card mt-3 p-3 max-h-64 overflow-y-auto">
          {stickers.length === 0 && <p className="text-muted text-[14px] text-center py-4">{d.no_stickers}</p>}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {stickers.map((st) => (
              <button key={st.id} onClick={() => addSticker(st.image_url)} title={st.name} className="aspect-square rounded-xl border border-line p-1.5 hover:border-ink bg-white">
                <img src={st.image_url} alt={st.name} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      )}
      {tool === "tpl" && (
        <div className="card mt-3 p-4">
          <p className="text-[13px] text-muted">{d.tpl_hint}</p>
          <div className="grid grid-cols-[1fr_90px] gap-2 mt-2">
            <input className="input" placeholder={d.tpl_name} value={tplName} maxLength={16} onChange={(e) => setTplName(e.target.value)} />
            <input className="input px-3" placeholder={d.tpl_number} value={tplNum} maxLength={3} onChange={(e) => setTplNum(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {([["jersey", d.tpl_jersey], ["vertical", d.tpl_vertical], ["plate", d.tpl_plate], ["heart", d.tpl_heart]] as const).map(([k, label]) => (
              <button key={k} onClick={() => addTemplate(k)} className="chip justify-center h-12">{label}</button>
            ))}
          </div>
        </div>
      )}
      {tool === "photo" && (
        <button onClick={() => fileRef.current?.click()} className="btn-light w-full mt-3">{d.ed_upload_btn}</button>
      )}

      <div className="flex justify-between items-center mt-4 text-[13px] text-muted">
        <span>{d.ed_hint}</span>
        <button onClick={reset} className="underline hover:text-ink">{d.ed_reset}</button>
      </div>
    </div>
  );
});

export default Editor;
