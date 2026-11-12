"use client";
import { useActionState, useEffect, useRef } from "react";
import { changeMyPassword } from "@/app/admin/actions";

export default function AccountForm() {
  const [state, action, pending] = useActionState(changeMyPassword, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state && "ok" in state) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card p-5 mt-5 space-y-4">
      <div><label className="label" htmlFor="current">Current password</label><input id="current" name="current" type="password" className="input" autoComplete="current-password" required /></div>
      <div><label className="label" htmlFor="next">New password <span className="font-normal text-muted">(at least 8 characters)</span></label><input id="next" name="next" type="password" className="input" autoComplete="new-password" minLength={8} required /></div>
      <div><label className="label" htmlFor="again">New password again</label><input id="again" name="again" type="password" className="input" autoComplete="new-password" minLength={8} required /></div>
      {state && "error" in state && <p className="text-red-600 text-[14px]">{state.error}</p>}
      {state && "ok" in state && <p className="rounded-xl bg-green-100 text-green-800 px-4 py-3 text-[14px]">Password changed. Use the new one next time you sign in.</p>}
      <button disabled={pending} className="btn-dark">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
