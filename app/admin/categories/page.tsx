import { getCategories, sql } from "@/lib/db";
import { addCategory, deleteCategory, requireAdmin, updateCategory } from "../actions";
import ConfirmButton from "@/components/ConfirmButton";

export default async function CategoriesAdmin() {
  await requireAdmin();
  const cats = await getCategories();
  const counts = await sql("SELECT category_id, COUNT(*)::int AS n FROM designs GROUP BY category_id");
  const n = (id: number) => counts.find((c) => c.category_id === id)?.n ?? 0;
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[32px] font-bold">Categories</h1>
      <form action={addCategory} className="card p-5 mt-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div><label className="label">Name in Albanian</label><input name="name_sq" className="input" placeholder="p.sh. Patriotike" required /></div>
        <div><label className="label">Name in English</label><input name="name_en" className="input" placeholder="e.g. Patriotic" /></div>
        <button className="btn-dark">Add</button>
      </form>
      <div className="card mt-5 divide-y divide-line">
        {cats.map((c) => (
          <div key={c.id} className="p-4 flex flex-wrap items-end gap-3">
            <form action={updateCategory} className="flex flex-wrap items-end gap-3 flex-1">
              <input type="hidden" name="id" value={c.id} />
              <label className="text-[12px] text-muted flex-1 min-w-[130px]">Albanian<input name="name_sq" defaultValue={c.name_sq} className="input h-10 text-[15px] text-ink" /></label>
              <label className="text-[12px] text-muted flex-1 min-w-[130px]">English<input name="name_en" defaultValue={c.name_en} className="input h-10 text-[15px] text-ink" /></label>
              <label className="text-[12px] text-muted w-16">Order<input name="sort" type="number" defaultValue={c.sort} className="input h-10 text-[15px] text-ink px-2" /></label>
              <button className="chip">Save</button>
            </form>
            <span className="text-[13px] text-muted h-10 inline-flex items-center">{n(c.id)} designs</span>
            <form action={deleteCategory}><input type="hidden" name="id" value={c.id} />
              <ConfirmButton message={`Delete category "${c.name_sq}"? Its designs stay, without a category.`} className="chip text-red-600">Delete</ConfirmButton></form>
          </div>
        ))}
      </div>
    </div>
  );
}
