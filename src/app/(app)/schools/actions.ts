"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { directorates, schools, teachers } from "@/db/schema";
import { readUploadedSheet, toInt, type ImportState } from "@/lib/excel";
import { requireAdmin } from "@/lib/session";

import { fail, type FormState } from "@/lib/form-state";

export type { FormState };
const FIELDS = ["id", "name", "directorateId"];

const fields = {
  name: z.string().trim().min(1, "اسم المدرسة مطلوب").max(255, "اسم المدرسة طويل جداً"),
  directorateId: z.coerce
    .number({ message: "اختر المديرية" })
    .int("اختر المديرية")
    .positive("اختر المديرية"),
};

async function directorateExists(id: number) {
  return Boolean(await db.query.directorates.findFirst({ where: eq(directorates.id, id) }));
}

export async function createSchool(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.coerce.number().int("رقم المدرسة يجب أن يكون رقماً صحيحاً").positive("رقم المدرسة مطلوب"),
      ...fields,
    })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      directorateId: formData.get("directorateId"),
    });
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);

  if (await db.query.schools.findFirst({ where: eq(schools.id, parsed.data.id) })) {
    return fail("رقم المدرسة مستخدم مسبقاً", formData, FIELDS);
  }
  if (!(await directorateExists(parsed.data.directorateId))) return fail("المديرية غير موجودة", formData, FIELDS);

  const now = new Date();
  await db.insert(schools).values({ ...parsed.data, createdAt: now, updatedAt: now });
  revalidatePath("/schools");
  redirect("/schools?success=created");
}

export async function updateSchool(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z.object(fields).safeParse({
    name: formData.get("name"),
    directorateId: formData.get("directorateId"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);
  if (!(await directorateExists(parsed.data.directorateId))) return fail("المديرية غير موجودة", formData, FIELDS);

  await db
    .update(schools)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schools.id, id));
  revalidatePath("/schools");
  redirect("/schools?success=updated");
}

export async function deleteSchool(id: number) {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(teachers).where(eq(teachers.schoolId, id));
  if (n > 0) redirect("/schools?error=has-teachers");

  try {
    await db.delete(schools).where(eq(schools.id, id));
  } catch (e) {
    console.error("deleteSchool failed", e);
    redirect("/schools?error=delete-failed");
  }
  revalidatePath("/schools");
  redirect("/schools?success=deleted");
}

// Same rules as ExcelController::importSchools: every row is checked first,
// and if ANY row has a problem nothing is imported.
export async function importSchools(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const sheet = await readUploadedSheet(formData.get("file"));
  if ("error" in sheet) return { error: sheet.error };
  if (sheet.rows.length === 0) return { error: "الملف فارغ أو لا يحتوي على بيانات صالحة." };

  const idsInFile = sheet.rows.map((r) => toInt(r.School_ID)).filter((n): n is number => n !== null);
  const existing = new Set(
    idsInFile.length
      ? (await db.select({ id: schools.id }).from(schools).where(inArray(schools.id, idsInFile))).map((r) => r.id)
      : [],
  );
  const directorateIds = new Set((await db.select({ id: directorates.id }).from(directorates)).map((r) => r.id));

  const errors: string[] = [];
  const seen = new Map<number, number>();
  const toInsert: { id: number; name: string; directorateId: number }[] = [];

  for (const row of sheet.rows) {
    const line = row._row;
    const id = toInt(row.School_ID);
    const name = row.SchoolName === null || row.SchoolName === undefined ? "" : String(row.SchoolName).trim();
    const directorateId = toInt(row.directorate_id);

    if (!id || !name || !directorateId) {
      errors.push(`السطر ${line}: يجب توفر School_ID و SchoolName و directorate_id.`);
      continue;
    }
    if (name.length > 255) {
      errors.push(`السطر ${line}: اسم المدرسة طويل جداً.`);
      continue;
    }
    if (existing.has(id)) {
      errors.push(`السطر ${line}: المدرسة برقم ${id} موجودة بالفعل.`);
      continue;
    }
    if (seen.has(id)) {
      errors.push(`السطر ${line}: رقم المدرسة ${id} مكرر في الملف (السطر ${seen.get(id)}).`);
      continue;
    }
    if (!directorateIds.has(directorateId)) {
      errors.push(`السطر ${line}: المديرية برقم ${directorateId} غير موجودة.`);
      continue;
    }
    seen.set(id, line);
    toInsert.push({ id, name, directorateId });
  }

  if (errors.length) return { error: "تم إيقاف الاستيراد بالكامل بسبب وجود أخطاء.", rowErrors: errors };

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(schools).values(toInsert.map((s) => ({ ...s, createdAt: now, updatedAt: now })));
  });
  revalidatePath("/schools");
  return { ok: true, message: `${toInsert.length} مدرسة تم استيرادها بنجاح.` };
}
