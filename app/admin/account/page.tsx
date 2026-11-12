import { requireStaff } from "../actions";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
  const me = await requireStaff();
  return (
    <div className="max-w-md">
      <h1 className="font-display text-[32px] font-bold">Change password</h1>
      <p className="text-muted mt-1">Signed in as <b className="text-ink">{me.name}</b>.</p>
      <AccountForm />
      {me.uid === 0 && (
        <p className="text-[13px] text-muted mt-4">
          Forgot it later? Set a new <b>ADMIN_PASSWORD</b> in Vercel → Settings → Environment Variables and redeploy; that one will work again.
        </p>
      )}
    </div>
  );
}
