import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-5 text-sm font-medium">
            <Link href="/admin" className="font-bold text-rose-700">Maya&apos;s Admin</Link>
            <Link href="/admin/brands">Brands</Link>
            <Link href="/admin/settings">Settings</Link>
          </nav>
          <form action={logoutAction}>
            <button className="text-sm text-neutral-600 underline">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
