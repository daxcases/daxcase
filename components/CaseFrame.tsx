"use client";
import { useId } from "react";
import type { PhoneModel } from "@/lib/phones";
import type { MaterialId } from "@/lib/config";

/** Rim thickness (mm) — the visible edge of the case around the print */
export const rimFor = (material?: MaterialId) => (material === "tough" ? 2.4 : 1.6);

function rr(x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
}

function Lens({ cx, cy, d, uid, ring = "#9a9aa0" }: { cx: number; cy: number; d: number; uid: string; ring?: string }) {
  const r = d / 2;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-ring)`} stroke={ring} strokeWidth={r * 0.06} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="#0c0c0f" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={`url(#${uid}-glass)`} />
      <circle cx={cx} cy={cy} r={r * 0.24} fill="#1b2140" opacity={0.9} />
      <circle cx={cx - r * 0.22} cy={cy - r * 0.24} r={r * 0.1} fill="#fff" opacity={0.55} />
    </g>
  );
}

function Flash({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={d / 2} fill="#f4f1e6" stroke="#b9b9be" strokeWidth={d * 0.06} />
      <circle cx={cx} cy={cy} r={d * 0.3} fill="#fff6c9" />
    </g>
  );
}

function Dot({ cx, cy, d, fill = "#1a1a1d" }: { cx: number; cy: number; d: number; fill?: string }) {
  return <circle cx={cx} cy={cy} r={d / 2} fill={fill} stroke="#8e8e94" strokeWidth={d * 0.08} />;
}

function Camera({ m, e, uid }: { m: PhoneModel; e: number; uid: string }) {
  const { w, h } = m;
  const cut = "#121214"; // case cut-out edge
  const body = `url(#${uid}-metal)`; // phone body seen through cut-out
  const x0 = e + 1.2;
  const y0 = e + 1.2;

  switch (m.camera) {
    case "pro-plateau": {
      const pw = w - 2 * x0;
      const ph = h * 0.205;
      const d = w * 0.185;
      return (
        <g>
          <path d={rr(x0 - 0.5, y0 - 0.5, pw + 1, ph + 1, m.r - e - 0.7)} fill={cut} />
          <path d={rr(x0, y0, pw, ph, m.r - e - 1.2)} fill={body} />
          <Lens uid={uid} cx={x0 + d * 0.72} cy={y0 + ph * 0.28} d={d} />
          <Lens uid={uid} cx={x0 + d * 0.72} cy={y0 + ph * 0.73} d={d} />
          <Lens uid={uid} cx={x0 + d * 1.66} cy={y0 + ph * 0.505} d={d} />
          <Flash cx={x0 + pw - d * 0.55} cy={y0 + ph * 0.3} d={d * 0.36} />
          <Dot cx={x0 + pw - d * 0.55} cy={y0 + ph * 0.72} d={d * 0.42} />
          <Dot cx={x0 + pw - d * 1.05} cy={y0 + ph * 0.5} d={d * 0.12} />
        </g>
      );
    }
    case "air-bar": {
      const pw = w - 2 * x0;
      const ph = h * 0.115;
      const d = ph * 0.62;
      return (
        <g>
          <path d={rr(x0 - 0.5, y0 - 0.5, pw + 1, ph + 1, ph / 2 + 0.5)} fill={cut} />
          <path d={rr(x0, y0, pw, ph, ph / 2)} fill={body} />
          <Lens uid={uid} cx={x0 + ph * 0.55} cy={y0 + ph / 2} d={d} />
          <Dot cx={x0 + ph * 1.25} cy={y0 + ph / 2} d={d * 0.36} />
          <Flash cx={x0 + ph * 1.75} cy={y0 + ph / 2} d={d * 0.4} />
        </g>
      );
    }
    case "pro-square": {
      const s = w * 0.46;
      const d = s * 0.42;
      return (
        <g>
          <path d={rr(x0 - 0.6, y0 - 0.6, s + 1.2, s + 1.2, s * 0.26)} fill={cut} />
          <path d={rr(x0, y0, s, s, s * 0.24)} fill={body} />
          <Lens uid={uid} cx={x0 + s * 0.28} cy={y0 + s * 0.27} d={d} />
          <Lens uid={uid} cx={x0 + s * 0.28} cy={y0 + s * 0.73} d={d} />
          <Lens uid={uid} cx={x0 + s * 0.7} cy={y0 + s * 0.5} d={d} />
          <Flash cx={x0 + s * 0.8} cy={y0 + s * 0.17} d={d * 0.32} />
          <Dot cx={x0 + s * 0.8} cy={y0 + s * 0.83} d={d * 0.34} />
        </g>
      );
    }
    case "dual-vertical":
    case "dual-diag": {
      const s = w * 0.37;
      const d = s * 0.4;
      const diag = m.camera === "dual-diag";
      return (
        <g>
          <path d={rr(x0 - 0.6, y0 - 0.6, s + 1.2, s + 1.2, s * 0.28)} fill={cut} />
          <path d={rr(x0, y0, s, s, s * 0.26)} fill={body} />
          {diag ? (
            <>
              <Lens uid={uid} cx={x0 + s * 0.3} cy={y0 + s * 0.3} d={d} />
              <Lens uid={uid} cx={x0 + s * 0.7} cy={y0 + s * 0.7} d={d} />
              <Flash cx={x0 + s * 0.74} cy={y0 + s * 0.26} d={d * 0.36} />
            </>
          ) : (
            <>
              <path d={rr(x0 + s * 0.08, y0 + s * 0.06, s * 0.46, s * 0.88, s * 0.23)} fill="#bfc0c5" opacity={0.6} />
              <Lens uid={uid} cx={x0 + s * 0.31} cy={y0 + s * 0.29} d={d} />
              <Lens uid={uid} cx={x0 + s * 0.31} cy={y0 + s * 0.71} d={d} />
              <Flash cx={x0 + s * 0.76} cy={y0 + s * 0.5} d={d * 0.36} />
            </>
          )}
        </g>
      );
    }
    case "single": {
      const s = w * 0.22;
      return (
        <g>
          <path d={rr(x0 - 0.6, y0 - 0.6, s * 1.65 + 1.2, s + 1.2, s * 0.32)} fill={cut} />
          <path d={rr(x0, y0, s * 1.65, s, s * 0.3)} fill={body} />
          <Lens uid={uid} cx={x0 + s * 0.5} cy={y0 + s * 0.5} d={s * 0.74} />
          <Flash cx={x0 + s * 1.2} cy={y0 + s * 0.5} d={s * 0.3} />
        </g>
      );
    }
    case "sam-vertical3":
    case "sam-ultra": {
      const ultra = m.camera === "sam-ultra";
      const d = w * (ultra ? 0.165 : 0.15);
      const cx = x0 + d * 0.85;
      const gap = d * 1.32;
      const cy0 = y0 + d * 0.85;
      const ringed = (x: number, y: number, dd: number, k: string) => (
        <g key={k}>
          <circle cx={x} cy={y} r={dd / 2 + 0.9} fill={cut} />
          <Lens uid={uid} cx={x} cy={y} d={dd} ring="#6b6b70" />
        </g>
      );
      return (
        <g>
          {[0, 1, 2].map((i) => ringed(cx, cy0 + i * gap, d, `l${i}`))}
          {ultra ? (
            <>
              {ringed(cx + d * 1.2, cy0 + gap * 0.25, d * 0.62, "p")}
              <Dot cx={cx + d * 1.2} cy={cy0 + gap * 0.95} d={d * 0.28} />
              <Flash cx={cx + d * 1.2} cy={cy0 + gap * 1.5} d={d * 0.34} />
            </>
          ) : (
            <Flash cx={cx + d * 1.0} cy={cy0 + gap * 0.1} d={d * 0.34} />
          )}
        </g>
      );
    }
    case "sam-island":
    case "sam-island-ultra": {
      const ultra = m.camera === "sam-island-ultra";
      const d = w * (ultra ? 0.165 : 0.15);
      const iw = d * 1.3;
      const gap = d * 1.15;
      const ih = gap * 2 + iw;
      const cx = x0 + iw / 2 + 0.6;
      const cy0 = y0 + iw / 2 + 0.6;
      return (
        <g>
          <path d={rr(cx - iw / 2 - 0.7, cy0 - iw / 2 - 0.7, iw + 1.4, ih + 1.4, iw / 2 + 0.7)} fill={cut} />
          <path d={rr(cx - iw / 2, cy0 - iw / 2, iw, ih, iw / 2)} fill={`url(#${uid}-dark)`} />
          {[0, 1, 2].map((i) => (
            <Lens key={i} uid={uid} cx={cx} cy={cy0 + i * gap} d={d} ring="#6b6b70" />
          ))}
          {ultra ? (
            <>
              <circle cx={cx + iw * 0.95} cy={cy0 + gap * 0.2} r={d * 0.33 + 0.8} fill={cut} />
              <Lens uid={uid} cx={cx + iw * 0.95} cy={cy0 + gap * 0.2} d={d * 0.66} ring="#6b6b70" />
              <Dot cx={cx + iw * 0.95} cy={cy0 + gap * 0.95} d={d * 0.26} />
              <Flash cx={cx + iw * 0.95} cy={cy0 + gap * 1.5} d={d * 0.32} />
            </>
          ) : (
            <Flash cx={cx + iw * 0.92} cy={cy0} d={d * 0.32} />
          )}
        </g>
      );
    }
  }
}

export type CaseFrameProps = {
  model: PhoneModel;
  image?: string | null;
  background?: string;
  caseColor?: string;
  material?: MaterialId;
  /** Overlay mode: draw rim + camera + finish only (for the live editor) */
  overlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function CaseFrame({
  model, image, background = "#e9e9ea", caseColor = "#141416", material = "glossy",
  overlay = false, className, style,
}: CaseFrameProps) {
  const uid = useId().replace(/:/g, "");
  const { w, h, r } = model;
  const e = rimFor(material);
  const ix = e, iy = e, iw = w - 2 * e, ih = h - 2 * e, ir = r - e;
  const inner = rr(ix, iy, iw, ih, ir);
  const outer = rr(0, 0, w, h, r);
  const clear = caseColor.toLowerCase() === "#d7dbe0";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <clipPath id={`${uid}-clip`}><path d={inner} /></clipPath>
        <radialGradient id={`${uid}-ring`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#f4f4f6" />
          <stop offset=".55" stopColor="#b8b8bd" />
          <stop offset="1" stopColor="#77777c" />
        </radialGradient>
        <radialGradient id={`${uid}-glass`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#3a3f63" />
          <stop offset=".6" stopColor="#14162a" />
          <stop offset="1" stopColor="#050508" />
        </radialGradient>
        <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ececef" />
          <stop offset=".5" stopColor="#cfcfd4" />
          <stop offset="1" stopColor="#e4e4e8" />
        </linearGradient>
        <linearGradient id={`${uid}-dark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c2d31" />
          <stop offset="1" stopColor="#151518" />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".06" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset=".78" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#fff" stopOpacity=".14" />
        </linearGradient>
        <radialGradient id={`${uid}-soft`} cx="30%" cy="20%" r="90%">
          <stop offset="0" stopColor="#fff" stopOpacity=".14" />
          <stop offset="1" stopColor="#000" stopOpacity=".1" />
        </radialGradient>
        <filter id={`${uid}-noise`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0" />
        </filter>
        <filter id={`${uid}-inset`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>

      {!overlay && (
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x={ix} y={iy} width={iw} height={ih} fill={background} />
          {image && (
            <image href={image} x={ix} y={iy} width={iw} height={ih} preserveAspectRatio="xMidYMid slice" />
          )}
        </g>
      )}

      {/* finish */}
      <g clipPath={`url(#${uid}-clip)`} style={{ pointerEvents: "none" }}>
        <path d={inner} fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="1.6" filter={`url(#${uid}-inset)`} />
        {(material === "glossy" || material === "tough") && <rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-gloss)`} />}
        {material === "soft" && <rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-soft)`} />}
        {material === "matte" && (
          <>
            <rect x={0} y={0} width={w} height={h} fill="#fff" opacity=".06" />
            <rect x={0} y={0} width={w} height={h} filter={`url(#${uid}-noise)`} opacity=".5" />
          </>
        )}
      </g>

      {/* rim */}
      <path d={outer + inner} fillRule="evenodd" fill={caseColor} opacity={clear ? 0.55 : 1} />
      <path d={outer} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth=".35" />
      <path d={inner} fill="none" stroke="#fff" strokeOpacity={material === "tough" ? 0.22 : 0.12} strokeWidth=".3" />

      <Camera m={model} e={e} uid={uid} />
    </svg>
  );
}
