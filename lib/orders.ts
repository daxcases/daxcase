import { COUNTRIES } from "./locations";
import { formatPrice, type CountryCode } from "./config";

export const ORDER_STATUSES = ["new", "confirmed", "printing", "shipped", "delivered", "cancelled"];
export const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  confirmed: "bg-amber-100 text-amber-800",
  printing: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

/** The customer's details as plain text, ready to paste into a courier form or a message */
export function customerText(o: any): string {
  const c = COUNTRIES.find((x) => x.code === o.country);
  const items: any[] = o.items ?? [];
  return [
    `${o.first_name} ${o.last_name}`,
    o.phone,
    `${o.city}, ${c?.sq ?? o.country}`,
    o.address,
    o.notes ? `Shënim: ${o.notes}` : "",
    ...items.map((it) => `${it.phoneName} × ${it.qty}`),
    `Për pagesë: ${formatPrice(Number(o.total), o.country as CountryCode, "sq")}`,
    `Porosia: ${o.id}`,
  ].filter(Boolean).join("\n");
}

/** "iPhone 18 Pro Max × 1 + 2 more" */
export function casesText(o: any): string {
  const items: any[] = o.items ?? [];
  if (!items.length) return "";
  const n = items.reduce((a, i) => a + (i.qty ?? 1), 0);
  return items.length === 1 ? `${items[0].phoneName} × ${items[0].qty}` : `${n} cases: ${items.map((i) => `${i.phoneName} × ${i.qty}`).join(", ")}`;
}
