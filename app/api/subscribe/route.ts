import { NextResponse } from "next/server";
import { getMarketing, getSubscribers, setSubscribers, welcomePercentFor } from "@/lib/db";

const clean = (v: unknown) => String(v ?? "").trim().toLowerCase().slice(0, 120);
const valid = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// Email sign-up from the welcome pop-up. The discount is then applied automatically in the basket.
export async function POST(req: Request) {
  const email = clean((await req.json().catch(() => ({}))).email);
  if (!valid(email)) return NextResponse.json({ ok: false }, { status: 400 });
  const list = await getSubscribers();
  if (!list.some((s) => s.email === email)) await setSubscribers([...list, { email, at: new Date().toISOString(), used: false }].slice(-20000));
  const m = await getMarketing();
  return NextResponse.json({ ok: true, percent: await welcomePercentFor(email), on: m.welcomeOn });
}

// The basket asks whether this email still has its welcome discount.
export async function GET(req: Request) {
  const email = clean(new URL(req.url).searchParams.get("email"));
  return NextResponse.json({ percent: valid(email) ? await welcomePercentFor(email) : 0 });
}
