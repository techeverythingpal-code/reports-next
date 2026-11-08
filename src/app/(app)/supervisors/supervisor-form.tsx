"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, inputClass } from "@/components/form";
import type { FormState } from "./actions";
import { valueOf } from "@/lib/form-state";

export function SupervisorForm({
  action,
  directorates,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  directorates: { id: number; name: string | null }[];
  initial?: { id: number; name: string | null; major: string | null; directorateId: number };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const editing = Boolean(initial);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="رقم المشرف (ID)"
          htmlFor="id"
          required
          hint={editing ? "تغيير الرقم ينقل معلمي المشرف إلى الرقم الجديد تلقائياً." : undefined}
        >
          <input id="id" name="id" type="number" required defaultValue={valueOf(state, "id", initial?.id)} placeholder="مثال: 123456" className={inputClass} />
        </Field>
        <Field label="اسم المشرف" htmlFor="name" required hint="يُستخدم لتسجيل الدخول، ويجب ألا يتكرر.">
          <input id="name" name="name" required maxLength={255} defaultValue={valueOf(state, "name", initial?.name)} placeholder="مثال: أحمد محمد" className={inputClass} />
        </Field>
        <Field label="التخصص" htmlFor="major" required>
          <input id="major" name="major" required maxLength={255} defaultValue={valueOf(state, "major", initial?.major)} placeholder="مثال: رياضيات" className={inputClass} />
        </Field>
        <Field label="المديرية" htmlFor="directorateId" required>
          <select
          key={valueOf(state, "directorateId", initial?.directorateId)}
          id="directorateId" name="directorateId" required defaultValue={valueOf(state, "directorateId", initial?.directorateId)} className={inputClass}>
            <option value="">-- اختر المديرية --</option>
            {directorates.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={editing ? "كلمة مرور جديدة" : "كلمة المرور"}
          htmlFor="password"
          required={!editing}
          hint={editing ? "اتركها فارغة للإبقاء على كلمة المرور الحالية." : "8 أحرف على الأقل."}
        >
          <input id="password" name="password" type="password" required={!editing} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="تأكيد كلمة المرور" htmlFor="confirm" required={!editing}>
          <input id="confirm" name="confirm" type="password" required={!editing} autoComplete="new-password" className={inputClass} />
        </Field>
      </div>

      <FormError error={state?.error} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-6 py-2 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "حفظ المشرف"}
        </button>
        <Link href="/supervisors" className="text-sm text-gray-500 hover:text-gray-700">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
