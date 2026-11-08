"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";
import { valueOf } from "@/lib/form-state";

const inputClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-100 disabled:text-gray-500";

export function DirectorateForm({
  action,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: { id: number; name: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const editing = Boolean(initial);

  return (
    <form action={formAction} className="max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="id" className="mb-1.5 block text-sm font-bold text-gray-700">
          رقم المديرية
        </label>
        <input
          id="id"
          name="id"
          type="number"
          required={!editing}
          disabled={editing}
          defaultValue={valueOf(state, "id", initial?.id)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-gray-700">
          اسم المديرية
        </label>
        <input id="name" name="name" required maxLength={255} defaultValue={valueOf(state, "name", initial?.name)} className={inputClass} />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-500 px-6 py-2 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}
        </button>
        <Link href="/directorates" className="text-sm text-gray-500 hover:text-gray-700">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
