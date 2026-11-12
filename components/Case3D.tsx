"use client";
import { useEffect, useRef, useState } from "react";
import CaseFrame from "./CaseFrame";
import type { PhoneModel } from "@/lib/phones";
import type { MaterialId } from "@/lib/config";

/**
 * A case the customer can turn around with a finger or the mouse.
 * Built from stacked layers with CSS 3D transforms, so it needs no 3D library.
 */
export default function Case3D({ model, image, material, caseColor }: {
  model: PhoneModel; image?: string | null; material: MaterialId; caseColor: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [rot, setRot] = useState({ x: -8, y: -28 });
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // slow sway until the customer touches it
  useEffect(() => {
    if (!auto) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { setRot({ x: -8, y: Math.sin((t - t0) / 1400) * 38 }); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  const k = w / model.w; // px per mm
  const depth = 10 * k; // a case is about 10 mm thick
  const layers = 14;
  const radius = `${(model.r / model.w) * 100}% / ${(model.r / model.h) * 100}%`;
  const face: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: radius, backfaceVisibility: "hidden" };

  return (
    <div
      ref={box}
      className="relative w-[78%] mx-auto select-none cursor-grab active:cursor-grabbing"
      style={{ aspectRatio: `${model.w} / ${model.h}`, perspective: w * 5, touchAction: "none" }}
      onPointerDown={(e) => { setAuto(false); drag.current = { px: e.clientX, py: e.clientY, x: rot.x, y: rot.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        const d = drag.current; if (!d) return;
        setRot({ y: d.y + (e.clientX - d.px) * 0.6, x: Math.max(-50, Math.min(50, d.x - (e.clientY - d.py) * 0.4)) });
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
    >
      {w > 0 && (
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
          {/* thickness */}
          {Array.from({ length: layers }, (_, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, borderRadius: radius, background: caseColor, filter: `brightness(${0.72 + (i / layers) * 0.2})`, transform: `translateZ(${depth / 2 - (i / (layers - 1)) * depth}px)` }} />
          ))}
          {/* printed back of the case */}
          <div style={{ ...face, transform: `translateZ(${depth / 2 + 0.5}px)` }}>
            <CaseFrame model={model} image={image} material={material} caseColor={caseColor} className="w-full h-full block" />
          </div>
          {/* inside of the case, seen from the other side */}
          <div style={{ ...face, transform: `rotateY(180deg) translateZ(${depth / 2 + 0.5}px)`, background: caseColor, padding: `${2.2 * k}px` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: radius, background: "linear-gradient(135deg,#2a2a2e,#0e0e10)", boxShadow: "inset 0 0 18px rgba(0,0,0,.6)" }} />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", left: "10%", right: "10%", bottom: "-7%", height: "6%", borderRadius: "50%", background: "rgba(0,0,0,.22)", filter: "blur(10px)" }} />
    </div>
  );
}
