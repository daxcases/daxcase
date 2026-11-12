import { NextResponse } from "next/server";
import { findActiveCode } from "@/lib/db";
import { normCode } from "@/lib/cart";

// The basket asks here whether a discount code is valid.
export async function GET(req: Request) {
  const c = await findActiveCode(normCode(new URL(req.url).searchParams.get("code")));
  if (!c) { await new Promise((r) => setTimeout(r, 400)); return NextResponse.json({ ok: false }); }
  return NextResponse.json({ ok: true, code: c.code, percent: c.percent });
}
