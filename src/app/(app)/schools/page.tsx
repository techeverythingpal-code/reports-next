import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, schools, teachers } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Flash } from "@/components/flash";
import { ImportPanel } from "@/components/import-panel";
import { deleteSchool, importSchools } from "./actions";

export const metadata: Metadata = { title: "إدارة المدارس" };

const messages = {
  success: {
    created: "تم إضافة المدرسة بنجاح",
    updated: "تم تعديل المدرسة بنجاح",
    deleted: "تم حذف المدرسة بنجاح",
  },
  error: {
    "has-teachers": "لا يمكن حذف هذه المدرسة لأنها تحتوي على معلمين",
    "delete-failed": "تعذر حذف المدرسة",
  },
} as const;

export default async function SchoolsPage({ searchParams }: PageProps<"/schools">) {
  await requireAdmin();
  const { success, error } = await searchParams;

  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      directorate: directorates.name,
      teacherCount: count(teachers.id),
    })
    .from(schools)
    .leftJoin(directorates, eq(directorates.id, schools.directorateId))
    .leftJoin(teachers, eq(teachers.schoolId, schools.id))
    .groupBy(schools.id, schools.name, directorates.name)
    .orderBy(asc(schools.id));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="me-auto text-xl font-semibold text-gray-800">🏫 إدارة المدارس</h1>
        {/* Plain <a download>: a file download, not a page. <Link> would prefetch it. */}
        <a
          href="/schools/export"
          download
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ⬇️ تصدير Excel
        </a>
        <Link
          href="/schools/new"
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          + إضافة مدرسة
        </Link>
        <ImportPanel key={`${success ?? ""}-${error ?? ""}`} title="⬆️ استيراد المدارس من Excel" action={importSchools}>
          الأعمدة المطلوبة: <span dir="ltr" className="font-mono">School_ID, SchoolName, directorate_id</span>
          <br />
          إذا كان في الملف أي خطأ، لن يتم استيراد أي سطر.
        </ImportPanel>
      </div>

      <Flash
        success={messages.success[success as keyof typeof messages.success]}
        error={messages.error[error as keyof typeof messages.error]}
      />

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-brand-700">
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">رقم المدرسة</th>
              <th className="px-6 py-4">اسم المدرسة</th>
              <th className="px-6 py-4">المديرية</th>
              <th className="px-6 py-4">عدد المعلمين</th>
              <th className="px-6 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  لا توجد مدارس بعد
                </td>
              </tr>
            )}
            {rows.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-100 transition hover:bg-brand-50">
                <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                <td className="px-6 py-4 font-bold text-brand-600">{s.id}</td>
                <td className="max-w-xs truncate px-6 py-4 font-medium text-gray-800" title={s.name ?? ""}>
                  {s.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{s.directorate ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                    {s.teacherCount} معلم
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/schools/${s.id}/edit`}
                      className="rounded-lg bg-blue-100 px-4 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                    >
                      ✏️ تعديل
                    </Link>
                    <ConfirmDelete action={deleteSchool.bind(null, s.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
