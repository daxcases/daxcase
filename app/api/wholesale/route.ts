import { NextResponse } from "next/server";
import { getWholesale, setWholesale } from "@/lib/db";
import { sendTelegram } from "@/lib/notify";

// Bulk order request from a business, school or club.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const g = (k: string, n: number) => String(b[k] ?? "").trim().slice(0, n);
  const r = { id: Date.now().toString(36), name: g("name", 80), business: g("business", 120), phone: g("phone", 30), qty: g("qty", 10), message: g("message", 800), at: new Date().toISOString() };
  if (!r.name || r.phone.replace(/\D/g, "").length < 8) return NextResponse.json({ ok: false }, { status: 400 });
  await setWholesale([...(await getWholesale()), r].slice(-500));
  await sendTelegram(`📦 Kërkesë me shumicë\n${r.name} · ${r.phone}\n${r.business}\nSasia: ${r.qty}\n${r.message}`).catch(() => {});
  return NextResponse.json({ ok: true });
}
