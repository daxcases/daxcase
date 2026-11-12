import { NextResponse } from "next/server";
import { loyaltyFor } from "@/lib/db";
import { phoneKey } from "@/lib/cart";

// Checkout asks how many cases in this order are free for the phone number typed in.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const n = Math.min(120, Math.max(1, Math.floor(Number(q.get("n")) || 1)));
  return NextResponse.json(await loyaltyFor(phoneKey(q.get("phone")), n));
}
