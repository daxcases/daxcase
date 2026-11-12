import { NextResponse } from "next/server";
import { getAllPhones, getWaitlist, setWaitlist } from "@/lib/db";

// "Notify me" for a phone model that is out of stock.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const model = (await getAllPhones()).find((p) => p.id === b.phoneId);
  const contact = String(b.contact ?? "").trim().slice(0, 60);
  if (!model || contact.replace(/\D/g, "").length < 8) return NextResponse.json({ ok: false }, { status: 400 });
  const list = await getWaitlist();
  if (!list.some((w) => w.model === model.name && w.contact === contact)) {
    await setWaitlist([...list, { id: Date.now().toString(36), model: model.name, contact, at: new Date().toISOString() }].slice(-2000));
  }
  return NextResponse.json({ ok: true });
}
