"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// Two-step confirm on the page itself (no window.confirm pop-up, which some
// embedded browsers block and treat as "Cancel").
export function ConfirmDelete({ action }: { action: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="rounded-lg bg-red-100 px-4 py-1 text-xs font-bold text-red-700 transition hover:bg-red-200"
      >
        🗑️ حذف
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <span className="text-xs text-red-700">متأكد؟</span>
      <ConfirmButton />
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
      >
        إلغاء
      </button>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "جارٍ الحذف..." : "نعم، احذف"}
    </button>
  );
}
