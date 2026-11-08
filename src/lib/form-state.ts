// React 19 resets a form after its server action finishes. To keep what the
// user typed when there is an error (like Laravel's old()), actions send the
// values back and forms use them as defaultValue. Never include passwords.

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

export function fail(error: string, formData: FormData, keys: string[]): FormState {
  const values: Record<string, string> = {};
  for (const k of keys) {
    const v = formData.get(k);
    if (typeof v === "string") values[k] = v;
  }
  return { error, values };
}

/** The value to show in a field: what was just submitted, else the saved value. */
export function valueOf(state: FormState, key: string, fallback?: string | number | null): string {
  return state?.values?.[key] ?? (fallback === null || fallback === undefined ? "" : String(fallback));
}
