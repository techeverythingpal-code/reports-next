"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, inputClass } from "@/components/form";
import type { FormState } from "./actions";
import { valueOf } from "@/lib/form-state";

export function SchoolForm({
  action,
  directorates,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  directorates: { id: number; name: string | null }[];
  initial?: { id: number; name: string | null; directorateId: number };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const editing = Boolean(initial);

  return (
    <form action={formAction} className="max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <Field label="رقم المدرسة" htmlFor="id" required={!editing}>
        <input
          id="id"
          name="id"
          type="number"
          required={!editing}
          disabled={editing}
          defaultValue={valueOf(state, "id", initial?.id)}
          className={inputClass}
        />
      </Field>
      <Field label="اسم المدرسة" htmlFor="name" required>
        <input id="name" name="name" required maxLength={255} defaultValue={valueOf(state, "name", initial?.name)} className={inputClass} />
      </Field>
      <Field label="المديرية" htmlFor="directorateId" required>
        <select
          key={valueOf(state, "directorateId", initial?.directorateId)}
          id="directorateId"
          name="directorateId"
          required
          defaultValue={valueOf(state, "directorateId", initial?.directorateId)}
          className={inputClass}
        >
          <option value="">-- اختر المديرية --</option>
          {directorates.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <FormError error={state?.error} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-6 py-2 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "إضافة"}
        </button>
        <Link href="/schools" className="text-sm text-gray-500 hover:text-gray-700">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
