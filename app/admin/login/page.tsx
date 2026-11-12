"use client";
import { useActionState } from "react";
import Logo from "@/components/Logo";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <div className="min-h-[70dvh] grid place-items-center">
      <form action={action} className="card p-8 w-full max-w-sm">
        <Logo className="text-[26px]" />
        <h1 className="text-[20px] font-semibold mt-6">Owner dashboard</h1>
        <p className="text-muted text-[14px] mt-1">Sign in to manage designs and orders.</p>
        <label className="label mt-6" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="Owner: leave empty" defaultValue={state?.email ?? ""} key={state?.email ?? ""} autoComplete="username" />
        <label className="label mt-4" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
        {state?.error && <p className="text-red-600 text-[14px] mt-3">{state.error}</p>}
        <button disabled={pending} className="btn-dark w-full mt-5">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
