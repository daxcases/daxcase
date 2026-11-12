import { sql } from "@/lib/db";
import { deleteUser, requireOwner, setUserPassword, setUserRole } from "../actions";
import AddUserForm from "@/components/AddUserForm";
import ConfirmButton from "@/components/ConfirmButton";

export default async function UsersAdmin() {
  const me = await requireOwner();
  const users = await sql("SELECT id, name, email, role, created_at FROM users ORDER BY created_at");
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[32px] font-bold">Users</h1>
      <p className="text-muted mt-1">
        <b className="text-ink">Admins</b> can do everything. <b className="text-ink">Editors</b> can add designs and categories and handle orders,
        but cannot change prices, phone models or users, and cannot delete orders.
        <b className="text-ink"> Shipping</b> users see only the shipping & stock page.
      </p>
      <AddUserForm />
      <div className="card mt-5 divide-y divide-line">
        <div className="p-4 flex items-center gap-3">
          <div className="flex-1"><b>Owner</b><div className="text-[13px] text-muted">Signs in with the main password (ADMIN_PASSWORD), email left empty</div></div>
          <span className="chip-on h-8 text-[12px]">Admin</span>
        </div>
        {users.map((u) => (
          <div key={u.id} className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]"><b>{u.name}</b>{u.id === me.uid && <span className="text-muted"> (you)</span>}<div className="text-[13px] text-muted">{u.email}</div></div>
            <form action={setUserRole} className="inline-flex p-1 rounded-xl border border-line">
              <input type="hidden" name="id" value={u.id} />
              {["shipper", "editor", "admin"].map((r) => (
                <button key={r} name="role" value={r} disabled={u.id === me.uid}
                  className={`h-8 px-3 rounded-lg text-[13px] font-semibold ${u.role === r ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>{r === "shipper" ? "Shipping" : r === "editor" ? "Editor" : "Admin"}</button>
              ))}
            </form>
            <form action={setUserPassword} className="flex gap-1">
              <input type="hidden" name="id" value={u.id} />
              <input name="password" placeholder="New password" minLength={8} required className="input h-10 w-36 text-[14px] px-3" autoComplete="off" />
              <button className="chip">Set</button>
            </form>
            {u.id !== me.uid && (
              <form action={deleteUser}><input type="hidden" name="id" value={u.id} />
                <ConfirmButton message={`Remove ${u.name}? They will no longer be able to sign in.`} className="chip text-red-600">Remove</ConfirmButton></form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
