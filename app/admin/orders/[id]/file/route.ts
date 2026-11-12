import { cookies } from "next/headers";
import { SESSION_COOKIE, parseSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readImage } from "@/lib/storage";

// Sends the customer's finished design (the print file) as a download.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!parseSession((await cookies()).get(SESSION_COOKIE)?.value)) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [o] = await sql("SELECT items FROM orders WHERE id = $1", [id]);
  const i = Math.max(0, Math.floor(Number(new URL(req.url).searchParams.get("i")) || 0));
  const url = o?.items?.[i]?.printUrl;
  if (!url) return new Response("Not found", { status: 404 });
  try {
    const img = await readImage(url);
    const png = img.type === "image/png";
    return new Response(new Uint8Array(img.data), {
      headers: {
        "content-type": png ? "image/png" : "image/jpeg",
        "content-disposition": `attachment; filename="${id}-${i + 1}.${png ? "png" : "jpg"}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch { return new Response("Not found", { status: 404 }); }
}
