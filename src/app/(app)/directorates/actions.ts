"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { directorates, schools, supervisors } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { fail, type FormState } from "@/lib/form-state";

export type { FormState };
const FIELDS = ["id", "name"];

// Every action re-checks the role: server actions are public endpoints,
// so hiding a button in the UI is not protection on its own.

const nameSchema = z.string().trim().min(1, "اسم المديرية مطلوب").max(255);

export async function createDirectorate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.coerce.number().int("رقم المديرية يجب أن يكون رقماً صحيحاً").positive("رقم المديرية مطلوب"),
      name: nameSchema,
    })
    .safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);

  const exists = await db.query.directorates.findFirst({ where: eq(directorates.id, parsed.data.id) });
  if (exists) return fail("رقم المديرية مستخدم مسبقاً", formData, FIELDS);

  const now = new Date();
  await db.insert(directorates).values({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/directorates");
  redirect("/directorates?success=created");
}

export async function updateDirectorate(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);

  await db
    .update(directorates)
    .set({ name: parsed.data, updatedAt: new Date() })
    .where(eq(directorates.id, id));
  revalidatePath("/directorates");
  redirect("/directorates?success=updated");
}

export async function deleteDirectorate(id: number) {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(schools).where(eq(schools.directorateId, id));
  if (n > 0) redirect("/directorates?error=has-schools");

  const [{ s }] = await db.select({ s: count() }).from(supervisors).where(eq(supervisors.directorateId, id));
  if (s > 0) redirect("/directorates?error=has-supervisors");

  try {
    await db.delete(directorates).where(eq(directorates.id, id));
  } catch (e) {
    console.error("deleteDirectorate failed", e);
    redirect("/directorates?error=delete-failed");
  }
  revalidatePath("/directorates");
  redirect("/directorates?success=deleted");
}
