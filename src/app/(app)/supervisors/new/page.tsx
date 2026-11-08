import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { directorates } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { createSupervisor } from "../actions";
import { SupervisorForm } from "../supervisor-form";

export const metadata: Metadata = { title: "إضافة مشرف" };

export default async function NewSupervisorPage() {
  await requireAdmin();
  const list = await db
    .select({ id: directorates.id, name: directorates.name })
    .from(directorates)
    .orderBy(asc(directorates.name));

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">👤 إضافة مشرف جديد</h1>
      <SupervisorForm action={createSupervisor} directorates={list} />
    </div>
  );
}
