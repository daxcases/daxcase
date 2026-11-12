import { NextResponse } from "next/server";
import { saveImage } from "@/lib/storage";

const MAX = 4 * 1024 * 1024;

// Customers' finished designs (print file + preview) are uploaded here before checkout.
export async function POST(req: Request) {
  const type = (req.headers.get("content-type") || "").split(";")[0];
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) {
    return NextResponse.json({ error: "type" }, { status: 415 });
  }
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX) return NextResponse.json({ error: "size" }, { status: 413 });
  const kind = new URL(req.url).searchParams.get("kind") === "print" ? "print" : "preview";
  try {
    const url = await saveImage(buf, type, `orders/${kind}`);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "storage", detail: String(e?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
