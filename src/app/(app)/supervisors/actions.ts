"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, inArray, max, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { directorates, supervisors, teachers } from "@/db/schema";
import { readUploadedSheet, toInt, type ImportState } from "@/lib/excel";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/session";

import { fail, type FormState } from "@/lib/form-state";

export type { FormState };
const FIELDS = ["id", "name", "major", "directorateId"];

// Imported accounts get this shared temporary password and must change it at
// first login (same as the Laravel import).
const TEMP_PASSWORD = "ChangeMe123";

const base = z.object({
  id: z.coerce.number().int("رقم المشرف يجب أن يكون رقماً صحيحاً").positive("رقم المشرف مطلوب"),
  name: z.string().trim().min(1, "اسم المشرف مطلوب").max(255, "اسم المشرف طويل جداً"),
  major: z.string().trim().min(1, "التخصص مطلوب").max(255, "التخصص طويل جداً"),
  directorateId: z.coerce.number({ message: "اختر المديرية" }).int("اختر المديرية").positive("اختر المديرية"),
});

const passwordRule = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .refine((p) => p !== TEMP_PASSWORD, "لا يمكن استخدام كلمة المرور الافتراضية");

function read(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    major: formData.get("major"),
    directorateId: formData.get("directorateId"),
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  };
}

// Supervisors sign in by name, so names must be unique (ignoring case/spaces).
async function nameTaken(name: string, exceptId?: number) {
  const cond = sql`LOWER(TRIM(${supervisors.name})) = ${name.trim().toLowerCase()}`;
  const found = await db
    .select({ id: supervisors.id })
    .from(supervisors)
    .where(exceptId === undefined ? cond : and(cond, ne(supervisors.id, exceptId)))
    .limit(1);
  return found.length > 0;
}

async function directorateExists(id: number) {
  return Boolean(await db.query.directorates.findFirst({ where: eq(directorates.id, id) }));
}

export async function createSupervisor(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = base
    .extend({ password: passwordRule, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "تأكيد كلمة المرور غير مطابق" })
    .safeParse(read(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);
  const d = parsed.data;

  if (await db.query.supervisors.findFirst({ where: eq(supervisors.id, d.id) })) {
    return fail("رقم المشرف مستخدم مسبقاً", formData, FIELDS);
  }
  if (await nameTaken(d.name)) return fail("اسم المشرف مستخدم مسبقاً", formData, FIELDS);
  if (!(await directorateExists(d.directorateId))) return fail("المديرية غير موجودة", formData, FIELDS);

  const now = new Date();
  await db.insert(supervisors).values({
    id: d.id,
    name: d.name,
    major: d.major,
    directorateId: d.directorateId,
    role: "user",
    password: await hashPassword(d.password),
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath("/supervisors");
  redirect("/supervisors?success=created");
}

export async function updateSupervisor(
  currentId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const raw = read(formData);
  const parsed = base
    .extend({ password: z.union([z.literal(""), passwordRule]), confirm: z.string() })
    .refine((d) => d.password === "" || d.password === d.confirm, { message: "تأكيد كلمة المرور غير مطابق" })
    .safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData, FIELDS);
  const d = parsed.data;

  if (d.id !== currentId && (await db.query.supervisors.findFirst({ where: eq(supervisors.id, d.id) }))) {
    return fail("رقم المشرف مستخدم مسبقاً", formData, FIELDS);
  }
  if (await nameTaken(d.name, currentId)) return fail("اسم المشرف مستخدم مسبقاً", formData, FIELDS);
  if (!(await directorateExists(d.directorateId))) return fail("المديرية غير موجودة", formData, FIELDS);

  // Role is left as it is (the Laravel forms never offered a choice).
  // Changing the ID is allowed: the database moves the supervisor's
  // teachers to the new ID automatically (ON UPDATE CASCADE).
  await db
    .update(supervisors)
    .set({
      id: d.id,
      name: d.name,
      major: d.major,
      directorateId: d.directorateId,
      updatedAt: new Date(),
      ...(d.password ? { password: await hashPassword(d.password) } : {}),
    })
    .where(eq(supervisors.id, currentId));
  revalidatePath("/supervisors");
  redirect("/supervisors?success=updated");
}

export async function deleteSupervisor(id: number) {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(teachers).where(eq(teachers.supervisorId, id));
  if (n > 0) redirect("/supervisors?error=has-teachers");

  try {
    await db.delete(supervisors).where(eq(supervisors.id, id));
  } catch (e) {
    console.error("deleteSupervisor failed", e);
    redirect("/supervisors?error=delete-failed");
  }
  revalidatePath("/supervisors");
  redirect("/supervisors?success=deleted");
}

// Same rules as ExcelController::importSupervisors: all rows are checked
// first, and if ANY row has a problem nothing is imported.
export async function importSupervisors(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const sheet = await readUploadedSheet(formData.get("file"));
  if ("error" in sheet) return { error: sheet.error };
  if (sheet.rows.length === 0) return { error: "الملف فارغ أو لا يحتوي على بيانات صالحة." };

  const idsInFile = sheet.rows.map((r) => toInt(r.SuperVisor_id)).filter((n): n is number => n !== null);
  const [existingIds, existingNames, directorateIds, [{ maxId }]] = await Promise.all([
    idsInFile.length
      ? db.select({ id: supervisors.id }).from(supervisors).where(inArray(supervisors.id, idsInFile))
      : Promise.resolve([]),
    db.select({ name: supervisors.name }).from(supervisors),
    db.select({ id: directorates.id }).from(directorates),
    db.select({ maxId: max(supervisors.id) }).from(supervisors),
  ]);
  const takenIds = new Set(existingIds.map((r) => r.id));
  const takenNames = new Set(existingNames.map((r) => (r.name ?? "").trim().toLowerCase()));
  const validDirectorates = new Set(directorateIds.map((r) => r.id));

  const errors: string[] = [];
  const idsSeen = new Map<number, number>();
  const namesSeen = new Map<string, number>();
  type Row = { id: number | null; name: string; major: string | null; directorateId: number; role: "admin" | "user" };
  const valid: Row[] = [];

  for (const row of sheet.rows) {
    const line = row._row;
    const id = toInt(row.SuperVisor_id);
    const name = row.SuperVisor_Name == null ? "" : String(row.SuperVisor_Name).trim();
    const major = row.SuperVisor_Major == null ? null : String(row.SuperVisor_Major).trim();
    const role = row.role == null ? "" : String(row.role).trim();
    const directorateId = toInt(row.directorate_id);

    if (row.SuperVisor_id != null && id === null) {
      errors.push(`السطر ${line}: SuperVisor_id يجب أن يكون رقماً صحيحاً.`);
      continue;
    }
    if (!name || !role) {
      errors.push(`السطر ${line}: يجب توفر SuperVisor_Name و role.`);
      continue;
    }
    if (role !== "admin" && role !== "user") {
      errors.push(`السطر ${line}: قيمة role غير صحيحة (admin أو user فقط).`);
      continue;
    }
    if (!directorateId) {
      errors.push(`السطر ${line}: يجب توفر directorate_id.`);
      continue;
    }
    if (!validDirectorates.has(directorateId)) {
      errors.push(`السطر ${line}: المديرية برقم ${directorateId} غير موجودة.`);
      continue;
    }
    if (id !== null && takenIds.has(id)) {
      errors.push(`السطر ${line}: المشرف برقم ${id} موجود بالفعل.`);
      continue;
    }
    if (id !== null && idsSeen.has(id)) {
      errors.push(`السطر ${line}: رقم المشرف ${id} مكرر في الملف (السطر ${idsSeen.get(id)}).`);
      continue;
    }
    const key = name.toLowerCase();
    if (takenNames.has(key)) {
      errors.push(`السطر ${line}: اسم المشرف "${name}" موجود بالفعل.`);
      continue;
    }
    if (namesSeen.has(key)) {
      errors.push(`السطر ${line}: اسم المشرف "${name}" مكرر في الملف (السطر ${namesSeen.get(key)}).`);
      continue;
    }
    if (id !== null) idsSeen.set(id, line);
    namesSeen.set(key, line);
    valid.push({ id, name, major, directorateId, role });
  }

  if (errors.length) return { error: "تم إيقاف الاستيراد بالكامل بسبب وجود أخطاء.", rowErrors: errors };

  // IDs are not auto-generated in this database, so rows without one get the
  // next free number after the highest existing or imported ID.
  let next = Math.max(maxId ?? 0, ...idsSeen.keys()) + 1;
  const password = await hashPassword(TEMP_PASSWORD);
  const now = new Date();
  const values = valid.map((r) => ({
    id: r.id ?? next++,
    name: r.name,
    major: r.major,
    directorateId: r.directorateId,
    role: r.role,
    password,
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction(async (tx) => {
    await tx.insert(supervisors).values(values);
  });
  revalidatePath("/supervisors");
  return {
    ok: true,
    message: `${values.length} مشرف تم استيراده بنجاح. تم تعيين كلمة مرور مؤقتة (${TEMP_PASSWORD})، وسيُطلب من كل مشرف تغييرها عند أول تسجيل دخول.`,
  };
}
