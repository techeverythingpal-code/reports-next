import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, schools } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { Flash } from "@/components/flash";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "إدارة المديريات" };

const messages = {
  success: {
    created: "تم إضافة المديرية بنجاح",
    updated: "تم تعديل المديرية بنجاح",
    deleted: "تم حذف المديرية بنجاح",
  },
  error: {
    "has-schools": "لا يمكن حذف هذه المديرية لأنها تحتوي على مدارس",
    "has-supervisors": "لا يمكن حذف هذه المديرية لأنها مرتبطة بمشرفين",
    "delete-failed": "تعذر حذف المديرية",
  },
} as const;

export default async function DirectoratesPage({ searchParams }: PageProps<"/directorates">) {
  await requireAdmin();
  const { success, error } = await searchParams;

  const rows = await db
    .select({ id: directorates.id, name: directorates.name, schoolCount: count(schools.id) })
    .from(directorates)
    .leftJoin(schools, eq(schools.directorateId, directorates.id))
    .groupBy(directorates.id, directorates.name)
    .orderBy(asc(directorates.id));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-800">🏢 إدارة المديريات</h1>
        <Link
          href="/directorates/new"
          className="rounded-lg bg-orange-500 px-5 py-2 font-bold text-white transition hover:bg-orange-600"
        >
          + إضافة مديرية
        </Link>
      </div>

      <Flash
        success={messages.success[success as keyof typeof messages.success]}
        error={messages.error[error as keyof typeof messages.error]}
      />

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-orange-100 bg-orange-50 text-orange-700">
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">رقم المديرية</th>
              <th className="px-6 py-4">اسم المديرية</th>
              <th className="px-6 py-4">عدد المدارس</th>
              <th className="px-6 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  لا توجد مديريات بعد
                </td>
              </tr>
            )}
            {rows.map((d, i) => (
              <tr key={d.id} className="border-b border-gray-100 transition hover:bg-orange-50">
                <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                <td className="px-6 py-4 font-bold text-orange-600">{d.id}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{d.name}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    {d.schoolCount} مدرسة
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/directorates/${d.id}/edit`}
                      className="rounded-lg bg-blue-100 px-4 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                    >
                      ✏️ تعديل
                    </Link>
                    <DeleteButton id={d.id} />
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
