import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, supervisors } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { updateSupervisor } from "../../actions";
import { SupervisorForm } from "../../supervisor-form";

export const metadata: Metadata = { title: "تعديل مشرف" };

export default async function EditSupervisorPage({ params }: PageProps<"/supervisors/[id]/edit">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();

  const [sup, list] = await Promise.all([
    db.query.supervisors.findFirst({ where: eq(supervisors.id, id) }),
    db.select({ id: directorates.id, name: directorates.name }).from(directorates).orderBy(asc(directorates.name)),
  ]);
  if (!sup) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">👤 تعديل المشرف: {sup.name}</h1>
      <SupervisorForm
        action={updateSupervisor.bind(null, sup.id)}
        directorates={list}
        initial={{ id: sup.id, name: sup.name, major: sup.major, directorateId: sup.directorateId }}
      />
    </div>
  );
}
