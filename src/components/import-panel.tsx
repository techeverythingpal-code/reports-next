"use client";

import { useActionState, useState } from "react";
import type { ImportState } from "@/lib/excel";

// Replaces the Laravel import modal: pick a file, upload, see every row error.
export function ImportPanel({
  title,
  action,
  children,
}: {
  title: string;
  action: (prev: ImportState, formData: FormData) => Promise<ImportState>;
  children: React.ReactNode; // explanation of the expected columns
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        ⬆️ استيراد Excel
      </button>

      {open && (
        <div className="w-full rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold text-gray-800">{title}</h2>
          <div className="mb-4 text-sm leading-7 text-gray-600">{children}</div>
          <form action={formAction} className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="file"
              accept=".xlsx,.csv"
              required
              className="text-sm file:me-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-bold file:text-emerald-700"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "جارٍ الاستيراد..." : "استيراد"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
              إلغاء
            </button>
          </form>
        </div>
      )}

      {state?.ok === true && (
        <p role="status" className="w-full rounded-lg border border-green-400 bg-green-100 p-4 text-green-700">
          ✅ {state.message}
        </p>
      )}
      {state && state.ok !== true && state.error && (
        <div role="alert" className="w-full rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
          <p>❌ {state.error}</p>
          {state.rowErrors && state.rowErrors.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 ps-6 text-sm">
              {state.rowErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
