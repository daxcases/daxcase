import { sql } from "@/lib/db";
import { requireOwner } from "../actions";
import { formatPrice, type CountryCode } from "@/lib/config";
import { COUNTRIES } from "@/lib/locations";

function Bars({ title, rows, unit = "" }: { title: string; rows: { label: string; n: number }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-[17px]">{title}</h2>
      {rows.length === 0 && <p className="text-muted text-[14px] mt-3">No data yet.</p>}
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="text-[14px]">
            <div className="flex justify-between gap-3"><span className="truncate">{r.label}</span><b className="tabular-nums">{r.n}{unit}</b></div>
            <div className="h-2 rounded-full bg-paper mt-1"><div className="h-2 rounded-full bg-brand" style={{ width: `${(r.n / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function StatsAdmin({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireOwner();
  const days = [7, 30, 90, 365].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const W = "created_at >= $1 AND status <> 'cancelled'";
  const [byCountry, byDay, cities, models, designs, kinds, cancelled] = await Promise.all([
    sql(`SELECT country, COUNT(*)::int AS orders, SUM(total)::float AS revenue FROM orders WHERE ${W} GROUP BY country`, [since]),
    sql(`SELECT to_char(created_at AT TIME ZONE 'Europe/Belgrade', 'DD.MM') AS day, MIN(created_at) AS t, COUNT(*)::int AS n FROM orders WHERE ${W} GROUP BY 1 ORDER BY t DESC LIMIT 14`, [since]),
    sql(`SELECT city AS label, COUNT(*)::int AS n FROM orders WHERE ${W} GROUP BY city ORDER BY n DESC LIMIT 8`, [since]),
    sql(`SELECT it->>'phoneName' AS label, SUM((it->>'qty')::int)::int AS n FROM orders, jsonb_array_elements(items) it WHERE ${W} GROUP BY 1 ORDER BY n DESC LIMIT 8`, [since]),
    sql(`SELECT it->>'designName' AS label, SUM((it->>'qty')::int)::int AS n FROM orders, jsonb_array_elements(items) it WHERE ${W} AND it->>'designName' IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 8`, [since]),
    sql(`SELECT CASE WHEN (it->>'custom')::boolean THEN 'Personalised' ELSE 'Our designs' END AS label, SUM((it->>'qty')::int)::int AS n FROM orders, jsonb_array_elements(items) it WHERE ${W} GROUP BY 1 ORDER BY n DESC`, [since]),
    sql(`SELECT COUNT(*)::int AS n FROM orders WHERE created_at >= $1 AND status = 'cancelled'`, [since]),
  ]);
  const orders = byCountry.reduce((a, r) => a + r.orders, 0);
  const cases = kinds.reduce((a, r) => a + r.n, 0);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[32px] font-bold">Statistics</h1>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((n) => <a key={n} href={`/admin/stats?days=${n}`} className={days === n ? "chip-on" : "chip"}>{n === 365 ? "1 year" : `${n} days`}</a>)}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <div className="card p-4"><div className="text-[13px] text-muted">Orders</div><div className="text-[28px] font-semibold">{orders}</div></div>
        <div className="card p-4"><div className="text-[13px] text-muted">Cases sold</div><div className="text-[28px] font-semibold">{cases}</div></div>
        <div className="card p-4"><div className="text-[13px] text-muted">Cancelled</div><div className="text-[28px] font-semibold">{cancelled[0]?.n ?? 0}</div></div>
        <div className="card p-4"><div className="text-[13px] text-muted">Sales (orders not cancelled)</div>
          {COUNTRIES.map((c) => { const r = byCountry.find((x) => x.country === c.code); return <div key={c.code} className="text-[15px] font-semibold">{c.flag} {formatPrice(r?.revenue ?? 0, c.code as CountryCode, "en")} <span className="text-muted font-normal">· {r?.orders ?? 0}</span></div>; })}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Bars title="Orders per day (last 14 days with orders)" rows={byDay.map((r) => ({ label: r.day, n: r.n }))} />
        <Bars title="Top cities" rows={cities as any} />
        <Bars title="Top phone models (cases)" rows={models as any} />
        <Bars title="Top designs (cases)" rows={designs as any} />
        <Bars title="Personalised vs our designs (cases)" rows={kinds as any} />
      </div>
    </div>
  );
}
