import "server-only";
import { getNotifyEmail } from "./db";
import { CASE_COLORS, MATERIALS, STORE, formatPrice, type CountryCode } from "./config";
import { COUNTRIES } from "./locations";

type MailItem = { phoneName: string; material: string; materialNameSq?: string; caseColor: string; qty: number; custom: boolean; designName: string | null; printUrl: string; previewUrl: string };
type OrderMail = {
  id: string; firstName: string; lastName: string; phone: string; email: string; country: CountryCode;
  city: string; address: string; notes: string; subtotal: number; shipping: number; total: number;
  discount: number; offerLabel: string | null; code: string | null; codeDiscount: number; items: MailItem[];
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Sends each new order to the shop's email through Resend (resend.com).
 * Needs RESEND_API_KEY in the environment and an address saved in /admin/settings.
 */
export async function sendOrderEmail(o: OrderMail, origin: string) {
  const key = process.env.RESEND_API_KEY;
  const to = (await getNotifyEmail()) || process.env.ORDER_EMAIL || "";
  if (!key || !to) return;
  const abs = (u: string) => (u.startsWith("http") ? u : origin + u);
  const fmt = (n: number) => formatPrice(n, o.country, "sq");
  const c = COUNTRIES.find((x) => x.code === o.country);
  const row = (k: string, v: string) => `<tr><td style="padding:4px 14px 4px 0;color:#6b6b73">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="margin:0 0 4px">Porosi e re ${o.id}</h2>
<p style="margin:0 0 16px;color:#6b6b73">Pagesa me para në dorë: <b style="color:#111">${fmt(o.total)}</b></p>
<table style="border-collapse:collapse">
${row("Klienti", `${o.firstName} ${o.lastName}`)}${row("Telefoni", o.phone)}${o.email ? row("Email", o.email) : ""}
${row("Shteti / qyteti", `${c?.sq ?? o.country} · ${o.city}`)}${row("Adresa", o.address)}${o.notes ? row("Shënime", o.notes) : ""}
</table>
<h3 style="margin:18px 0 8px">Mbrojtëset (${o.items.reduce((a, i) => a + i.qty, 0)})</h3>
${o.items.map((it) => `<table style="border-collapse:collapse;margin-bottom:12px"><tr>
<td style="vertical-align:top;padding-right:14px"><img src="${abs(it.previewUrl)}" alt="" width="80" style="border-radius:10px;border:1px solid #e6e6e8"></td>
<td style="vertical-align:top"><b>${esc(it.phoneName)} × ${it.qty}</b><br>
${esc(it.materialNameSq ?? MATERIALS.find((m) => m.id === it.material)?.sq ?? it.material)} · ${esc(CASE_COLORS.find((x) => x.id === it.caseColor)?.sq ?? it.caseColor)}<br>
${it.custom ? "I personalizuar" + (it.designName ? ` (${esc(it.designName)})` : "") : esc(it.designName ?? "")}<br>
<a href="${abs(it.printUrl)}">Shkarko skedarin për printim</a></td></tr></table>`).join("")}
<table style="border-collapse:collapse">
${o.offerLabel ? row(o.offerLabel, "−" + fmt(o.discount)) : ""}${o.code ? row("Kodi " + o.code, "−" + fmt(o.codeDiscount)) : ""}${row("Nëntotali", fmt(o.subtotal))}${row("Transporti", o.shipping === 0 ? "Falas" : fmt(o.shipping))}${row("Totali", fmt(o.total))}
</table>
<p style="margin-top:18px"><a href="${origin}/admin/orders/${o.id}">Hape në panel</a></p></div>`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: ctl.signal,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || `${STORE.shortName} <onboarding@resend.dev>`,
        to: to.split(",").map((x) => x.trim()).filter(Boolean),
        subject: `Porosi e re ${o.id} · ${o.firstName} ${o.lastName} · ${o.city} · ${fmt(o.total)}`,
        html,
      }),
    });
    if (!res.ok) console.error("order email rejected", res.status, await res.text());
  } finally { clearTimeout(timer); }
}
