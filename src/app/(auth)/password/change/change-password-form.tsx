"use client";

import { useActionState } from "react";
import { changePassword, logout } from "../../actions";

const inputClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-5">
        <Field id="current" label="كلمة المرور الحالية" autoComplete="current-password" />
        <Field id="password" label="كلمة المرور الجديدة" autoComplete="new-password" />
        <Field id="confirm" label="تأكيد كلمة المرور الجديدة" autoComplete="new-password" />

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
      </form>
      <form action={logout}>
        <button type="submit" className="w-full text-sm text-gray-500 hover:text-gray-700">
          تسجيل الخروج
        </button>
      </form>
    </div>
  );
}

function Field({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-gray-700">
        {label}
      </label>
      <input id={id} name={id} type="password" required autoComplete={autoComplete} className={inputClass} />
    </div>
  );
}
