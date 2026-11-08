import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تسجيل الدخول</h2>
        <p className="mt-1 text-sm text-gray-500">أدخل بياناتك للوصول إلى لوحة التحكم</p>
      </div>
      <LoginForm />
    </>
  );
}
