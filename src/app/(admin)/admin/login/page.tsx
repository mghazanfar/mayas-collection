import { redirect } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border border-neutral-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-bold">Admin login</h1>
      {!adminConfigured() ? (
        <p className="text-sm text-red-600">
          Login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET (see README).
        </p>
      ) : (
        <ActionForm action={loginAction} submitLabel="Log in">
          <label className="block text-sm">
            Email
            <input name="email" type="email" autoComplete="username" required className={input} />
          </label>
          <label className="mt-3 block text-sm">
            Password
            <input name="password" type="password" autoComplete="current-password" required className={input} />
          </label>
        </ActionForm>
      )}
    </div>
  );
}
