import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { updateDirectorate } from "../../actions";
import { DirectorateForm } from "../../directorate-form";

export const metadata: Metadata = { title: "تعديل مديرية" };

export default async function EditDirectoratePage({ params }: PageProps<"/directorates/[id]/edit">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const directorate = await db.query.directorates.findFirst({ where: eq(directorates.id, id) });
  if (!directorate) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">تعديل مديرية</h1>
      <DirectorateForm
        action={updateDirectorate.bind(null, directorate.id)}
        initial={{ id: directorate.id, name: directorate.name }}
      />
    </div>
  );
}
