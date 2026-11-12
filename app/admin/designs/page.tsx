import { getCategories, getDesigns } from "@/lib/db";
import { deleteDesign, requireAdmin, updateDesign } from "../actions";
import AddDesignForm from "@/components/AddDesignForm";
import ConfirmButton from "@/components/ConfirmButton";
import CaseFrame from "@/components/CaseFrame";
import { getPhone, DEFAULT_PHONE } from "@/lib/phones";

export default async function DesignsAdmin() {
  await requireAdmin();
  const [designs, cats, stickers] = await Promise.all([getDesigns({ activeOnly: false }), getCategories(), getDesigns({ activeOnly: false, kind: "sticker" })]);
  const phone = getPhone(DEFAULT_PHONE);
  return (
    <div>
      <h1 className="font-display text-[32px] font-bold">Designs</h1>
      <p className="text-muted mt-1">Designs you add here appear in the shop right away.</p>
      <div className="mt-5"><AddDesignForm categories={cats.map((c) => ({ id: c.id, name: c.name_sq }))} /></div>

      <h2 className="font-semibold text-[18px] mt-10">All designs ({designs.length})</h2>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {designs.map((x) => (
          <div key={x.id} className={`card p-3 ${x.active ? "" : "opacity-60"}`}>
            <CaseFrame model={phone} image={x.image_url} className="w-full h-auto" />
            <form action={updateDesign} className="mt-3">
              <input type="hidden" name="id" value={x.id} /><input type="hidden" name="field" value="name" />
              <input name="name" defaultValue={x.name} className="w-full font-semibold text-[14px] bg-transparent outline-none border-b border-transparent focus:border-ink" />
            </form>
            <form action={updateDesign} className="mt-2 flex gap-1">
              <input type="hidden" name="id" value={x.id} /><input type="hidden" name="field" value="category" />
              <select name="category_id" defaultValue={x.category_id ?? ""} className="flex-1 min-w-0 h-8 text-[13px] rounded-lg border border-line bg-white px-1">
                <option value="">No category</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name_sq}</option>)}
              </select>
              <button className="h-8 px-2 text-[12px] rounded-lg border border-line hover:border-ink">Save</button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1 text-[12px]">
              <form action={updateDesign}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="field" value="active" />
                <button className="h-7 px-2 rounded-lg border border-line hover:border-ink">{x.active ? "Hide" : "Show"}</button></form>
              <form action={updateDesign}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="field" value="featured" />
                <button className={`h-7 px-2 rounded-lg border ${x.featured ? "bg-ink text-white border-ink" : "border-line hover:border-ink"}`}>★ Featured</button></form>
              <form action={deleteDesign}><input type="hidden" name="id" value={x.id} />
                <ConfirmButton message={`Delete "${x.name}"?`} className="h-7 px-2 rounded-lg border border-line text-red-600 hover:border-red-600">Delete</ConfirmButton></form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-[18px] mt-12">Stickers ({stickers.length})</h2>
      <p className="text-muted text-[14px]">Customers add these on top of their design, in the designer under "Stickers".</p>
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
        {stickers.map((x) => (
          <div key={x.id} className={`card p-2 ${x.active ? "" : "opacity-50"}`}>
            <div className="aspect-square"><img src={x.image_url} alt="" className="w-full h-full object-contain" /></div>
            <div className="text-[12px] font-medium truncate mt-1">{x.name}</div>
            <div className="flex gap-1 mt-1 text-[11px]">
              <form action={updateDesign}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="field" value="active" />
                <button className="h-6 px-1.5 rounded-md border border-line">{x.active ? "Hide" : "Show"}</button></form>
              <form action={deleteDesign}><input type="hidden" name="id" value={x.id} />
                <ConfirmButton message={`Delete sticker "${x.name}"?`} className="h-6 px-1.5 rounded-md border border-line text-red-600">Delete</ConfirmButton></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
