"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { supervisors, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession, getCurrentUser } from "@/lib/session";

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

const loginSchema = z.object({
  login: z.string().trim().min(1, "أدخل اسم المستخدم أو البريد الإلكتروني"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

// Same order as Laravel's LoginRequest: try admin (by email), then supervisor (by name).
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });
  const typed = { login: String(formData.get("login") ?? "") };
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: typed };
  const { login, password } = parsed.data;

  await deleteSession();

  const admin = await db.query.users.findFirst({ where: eq(users.email, login) });
  if (admin && (await verifyPassword(password, admin.password))) {
    await createSession({ kind: "admin", id: admin.id, name: admin.name, mustChangePassword: false });
    redirect("/dashboard");
  }

  const sup = await db.query.supervisors.findFirst({ where: eq(supervisors.name, login) });
  if (sup && (await verifyPassword(password, sup.password))) {
    await createSession({
      kind: "supervisor",
      id: sup.id,
      name: sup.name ?? "",
      mustChangePassword: sup.mustChangePassword,
    });
    redirect(sup.mustChangePassword ? "/password/change" : "/dashboard");
  }

  return { error: "بيانات الدخول غير صحيحة", values: typed };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const changeSchema = z
  .object({
    current: z.string().min(1, "أدخل كلمة المرور الحالية"),
    password: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
      .refine((p) => p !== "ChangeMe123", "لا يمكن استخدام كلمة المرور الافتراضية"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "تأكيد كلمة المرور غير مطابق" })
  .refine((d) => d.password !== d.current, { message: "اختر كلمة مرور مختلفة عن الحالية" });

// Forced password change for supervisors still on a temporary password.
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.kind !== "supervisor") redirect("/login");

  const parsed = changeSchema.safeParse({
    current: formData.get("current"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const sup = await db.query.supervisors.findFirst({ where: eq(supervisors.id, user.id) });
  if (!sup || !(await verifyPassword(parsed.data.current, sup.password))) {
    return { error: "كلمة المرور الحالية غير صحيحة" };
  }

  await db
    .update(supervisors)
    .set({
      password: await hashPassword(parsed.data.password),
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(supervisors.id, user.id));

  await createSession({ kind: "supervisor", id: sup.id, name: sup.name ?? "", mustChangePassword: false });
  redirect("/dashboard");
}
