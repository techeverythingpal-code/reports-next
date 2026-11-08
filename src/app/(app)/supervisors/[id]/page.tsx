import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, supervisors, teacherGrades, teachers } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "إحصائيات المشرف" };

// Same numbers as SuperVisorController::show. Teachers without grades count as 0.
export default async function SupervisorStatsPage({ params }: PageProps<"/supervisors/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();

  const [sup] = await db
    .select({ name: supervisors.name, directorate: directorates.name })
    .from(supervisors)
    .leftJoin(directorates, eq(directorates.id, supervisors.directorateId))
    .where(eq(supervisors.id, id));
  if (!sup) notFound();

  const list = await db
    .select({ id: teachers.id, name: teachers.name, total: teacherGrades.total })
    .from(teachers)
    .leftJoin(teacherGrades, eq(teacherGrades.teacherId, teachers.teacherId))
    .where(eq(teachers.supervisorId, id))
    .orderBy(asc(teachers.name));

  const totals = list.map((t) => t.total ?? 0);
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const highest = totals.length ? Math.max(...totals) : 0;
  const lowest = totals.length ? Math.min(...totals) : 0;

  const cards = [
    { label: "المديرية", value: sup.directorate ?? "—" },
    { label: "إجمالي المعلمين", value: String(list.length) },
    { label: "متوسط الدرجات", value: avg.toFixed(1) },
    { label: "أعلى درجة", value: String(highest) },
    { label: "أدنى درجة", value: String(lowest) },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">📊 إحصائيات المشرف: {sup.name}</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div
              className={`mt-1 font-bold text-brand-600 ${
                /^[\d.]+$/.test(c.value) ? "text-2xl" : "text-base leading-snug"
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <h2 className="px-6 pt-5 font-bold text-gray-800">قائمة المعلمين</h2>
        <table className="mt-3 w-full text-right text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50 text-brand-700">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">اسم المعلم</th>
              <th className="px-6 py-3">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                  لا يوجد معلمون بعد
                </td>
              </tr>
            )}
            {list.map((t, i) => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                <td className="px-6 py-3 font-medium text-gray-800">{t.name}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      t.total === null ? "bg-gray-100 text-gray-500" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {t.total === null ? "لم يُقيَّم" : `${t.total} / 100`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/supervisors" className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← العودة لقائمة المشرفين
      </Link>
    </div>
  );
}
