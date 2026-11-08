"use client";

import { useActionState, useState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="login" className="mb-1.5 block text-sm font-bold text-gray-700">
          اسم المستخدم أو البريد الإلكتروني
        </label>
        <input
          id="login"
          name="login"
          required
          autoFocus
          defaultValue={state?.values?.login ?? ""}
          autoComplete="username"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-gray-700">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            className="block w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-16 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 left-3 text-xs font-bold text-brand-600 hover:text-brand-800"
          >
            {show ? "إخفاء" : "إظهار"}
          </button>
        </div>
      </div>

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
        {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
