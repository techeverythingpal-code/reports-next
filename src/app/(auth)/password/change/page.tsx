import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "تغيير كلمة المرور" };

// Deliberately NOT behind requireUser(), or flagged supervisors could never reach it.
export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.kind === "admin") redirect("/dashboard");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تغيير كلمة المرور</h2>
        <p className="mt-1 text-sm text-gray-500">
          يجب تغيير كلمة المرور المؤقتة قبل المتابعة.
        </p>
      </div>
      <ChangePasswordForm />
    </>
  );
}
