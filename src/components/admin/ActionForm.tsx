"use client";

import { useActionState } from "react";
import type { Result } from "@/app/(admin)/admin/actions";

type Props = {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  submitLabel: string;
  className?: string;
  confirm?: string;
  danger?: boolean;
  children: React.ReactNode;
};

// <form> wired to a server action: shows pending state, errors and "Saved".
export default function ActionForm({ action, submitLabel, className, confirm: confirmText, danger, children }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-neutral-700"}`}
        >
          {pending ? "…" : submitLabel}
        </button>
        {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-700">Saved.</p>}
      </div>
    </form>
  );
}
