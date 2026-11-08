import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, supervisors, teachers } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Flash } from "@/components/flash";
import { ImportPanel } from "@/components/import-panel";
import { deleteSupervisor, importSupervisors } from "./actions";

export const metadata: Metadata = { title: "إدارة المشرفين" };

const messages = {
  success: {
    created: "تم إضافة المشرف بنجاح",
    updated: "تم تعديل المشرف بنجاح",
    deleted: "تم حذف المشرف بنجاح",
  },
  error: {
    "has-teachers": "لا يمكن حذف هذا المشرف لأنه مرتبط بمعلمين",
    "delete-failed": "تعذر حذف المشرف",
  },
} as const;

export default async function SupervisorsPage({ searchParams }: PageProps<"/supervisors">) {
  await requireAdmin();
  const { success, error } = await searchParams;

  const rows = await db
    .select({
      id: supervisors.id,
      name: supervisors.name,
      major: supervisors.major,
      role: supervisors.role,
      mustChangePassword: supervisors.mustChangePassword,
      directorate: directorates.name,
      teacherCount: count(teachers.id),
    })
    .from(supervisors)
    .leftJoin(directorates, eq(directorates.id, supervisors.directorateId))
    .leftJoin(teachers, eq(teachers.supervisorId, supervisors.id))
    .groupBy(
      supervisors.id,
      supervisors.name,
      supervisors.major,
      supervisors.role,
      supervisors.mustChangePassword,
      directorates.name,
    )
    .orderBy(asc(supervisors.id));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="me-auto text-xl font-semibold text-gray-800">👤 إدارة المشرفين</h1>
        {/* Plain <a download>: a file download, not a page. <Link> would prefetch it. */}
        <a
          href="/supervisors/export"
          download
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ⬇️ تصدير Excel
        </a>
        <Link
          href="/supervisors/new"
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          + إضافة مشرف
        </Link>
        <ImportPanel key={`${success ?? ""}-${error ?? ""}`} title="⬆️ استيراد المشرفين من Excel" action={importSupervisors}>
          الأعمدة المطلوبة:{" "}
          <span dir="ltr" className="font-mono">
            SuperVisor_Name, SuperVisor_Major, directorate_id, role
          </span>
          <br />
          عمود اختياري: <span className="font-mono">SuperVisor_id</span> (إذا تُرك فارغًا يُعطى الرقم التالي تلقائيًا)
          <br />
          ⚠️ سيتم تعيين كلمة مرور مؤقتة لكل مشرف جديد، وسيُطلب منه تغييرها عند أول دخول.
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
              <th className="px-4 py-4">#</th>
              <th className="px-4 py-4">الرقم</th>
              <th className="px-4 py-4">اسم المشرف</th>
              <th className="px-4 py-4">التخصص</th>
              <th className="px-4 py-4">المديرية</th>
              <th className="px-4 py-4">الصلاحية</th>
              <th className="px-4 py-4">عدد المعلمين</th>
              <th className="px-4 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                  لا يوجد مشرفون بعد
                </td>
              </tr>
            )}
            {rows.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-100 transition hover:bg-brand-50">
                <td className="px-4 py-4 text-gray-400">{i + 1}</td>
                <td className="px-4 py-4 font-bold text-brand-600">{s.id}</td>
                <td className="px-4 py-4 font-medium text-gray-800">
                  {s.name}
                  {s.mustChangePassword && (
                    <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      كلمة مرور مؤقتة
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-600">{s.major}</td>
                <td className="px-4 py-4 text-gray-600">{s.directorate ?? "—"}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.role === "admin" ? "مدير" : "مشرف"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                    {s.teacherCount} معلم
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/supervisors/${s.id}`}
                      className="rounded-lg bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      📊 الإحصائيات
                    </Link>
                    <Link
                      href={`/supervisors/${s.id}/edit`}
                      className="rounded-lg bg-blue-100 px-4 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                    >
                      ✏️ تعديل
                    </Link>
                    <ConfirmDelete action={deleteSupervisor.bind(null, s.id)} />
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
