import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, schools, supervisors, teacherGrades, teachers } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "لوحة التحكم" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const { error } = await searchParams;

  // Supervisors only ever see their own teachers (same rule as the Laravel app).
  const mine = user.kind === "supervisor" ? eq(teachers.supervisorId, user.id) : undefined;

  const [[teacherCount], [gradedCount]] = await Promise.all([
    db.select({ n: count() }).from(teachers).where(mine),
    db
      .select({ n: count() })
      .from(teacherGrades)
      .innerJoin(teachers, eq(teachers.teacherId, teacherGrades.teacherId))
      .where(mine),
  ]);

  const cards: { label: string; value: number }[] = [
    { label: "المعلمون", value: teacherCount.n },
    { label: "تم تقييمهم", value: gradedCount.n },
  ];

  if (user.kind === "admin") {
    const [[d], [s], [sv]] = await Promise.all([
      db.select({ n: count() }).from(directorates),
      db.select({ n: count() }).from(schools),
      db.select({ n: count() }).from(supervisors),
    ]);
    cards.unshift(
      { label: "المديريات", value: d.n },
      { label: "المدارس", value: s.n },
      { label: "المشرفون", value: sv.n },
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">مرحباً، {user.name}</h1>

      {error === "forbidden" && (
        <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          ليس لديك صلاحية للوصول لهذه الصفحة
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-1 text-3xl font-bold text-brand-600">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
