import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, schools } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { updateSchool } from "../../actions";
import { SchoolForm } from "../../school-form";

export const metadata: Metadata = { title: "تعديل مدرسة" };

export default async function EditSchoolPage({ params }: PageProps<"/schools/[id]/edit">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [school, list] = await Promise.all([
    db.query.schools.findFirst({ where: eq(schools.id, id) }),
    db.select({ id: directorates.id, name: directorates.name }).from(directorates).orderBy(asc(directorates.name)),
  ]);
  if (!school) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">🏫 تعديل مدرسة</h1>
      <SchoolForm
        action={updateSchool.bind(null, school.id)}
        directorates={list}
        initial={{ id: school.id, name: school.name, directorateId: school.directorateId }}
      />
    </div>
  );
}
