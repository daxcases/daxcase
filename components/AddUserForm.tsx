"use client";
import { useActionState, useEffect, useRef } from "react";
import { addUser } from "@/app/admin/actions";

export default function AddUserForm() {
  const [state, action, pending] = useActionState(addUser, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && "ok" in state) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card p-5 mt-5">
      <h2 className="font-semibold text-[18px]">Add a person</h2>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div><label className="label">Name</label><input name="name" className="input" required /></div>
        <div><label className="label">Email</label><input name="email" type="email" className="input" required autoComplete="off" /></div>
        <div><label className="label">Password <span className="font-normal text-muted">(min. 8 characters)</span></label><input name="password" type="text" className="input" required minLength={8} autoComplete="off" /></div>
        <div>
          <label className="label">Role</label>
          <select name="role" className="input" defaultValue="editor">
            <option value="editor">Editor — designs, categories, orders</option>
            <option value="shipper">Shipping — only the shipping & stock page</option>
            <option value="admin">Admin — everything</option>
          </select>
        </div>
      </div>
      {state && "error" in state && <p className="text-red-600 text-[14px] mt-3">{state.error}</p>}
      {state && "ok" in state && <p className="text-green-700 text-[14px] mt-3">User added. Send them the email and password you entered.</p>}
      <button disabled={pending} className="btn-dark mt-5">{pending ? "Adding…" : "Add user"}</button>
    </form>
  );
}
