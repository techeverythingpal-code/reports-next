import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { directorates } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { createSchool } from "../actions";
import { SchoolForm } from "../school-form";

export const metadata: Metadata = { title: "إضافة مدرسة" };

export default async function NewSchoolPage() {
  await requireAdmin();
  const list = await db
    .select({ id: directorates.id, name: directorates.name })
    .from(directorates)
    .orderBy(asc(directorates.name));

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">🏫 إضافة مدرسة</h1>
      <SchoolForm action={createSchool} directorates={list} />
    </div>
  );
}
