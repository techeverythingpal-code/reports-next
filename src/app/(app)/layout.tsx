import Link from "next/link";
import { requireUser } from "@/lib/session";
import { logout } from "../(auth)/actions";
import { NavLink } from "./nav-link";

// Signed-in shell: sidebar on the right (RTL), like layouts/app.blade.php.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.kind === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-brand-100 lg:flex-row">
      <aside className="flex shrink-0 flex-col bg-brand-500 text-white lg:min-h-screen lg:w-64">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 text-lg font-bold">
          <span aria-hidden>📋</span>
          <span>نظام التقارير</span>
        </Link>

        <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:flex-1 lg:flex-col lg:flex-nowrap">
          <NavLink href="/dashboard">لوحة التحكم</NavLink>
          {isAdmin && (
            <>
              <NavLink href="/directorates">المديريات</NavLink>
              <NavLink href="/schools">المدارس</NavLink>
              <NavLink href="/supervisors">المشرفون</NavLink>
            </>
          )}
          <NavLink href="/teachers">المعلمون</NavLink>
        </nav>

        <div className="border-t border-white/15 px-5 py-4 text-sm">
          <div className="font-bold">{user.name}</div>
          <div className="text-white/70">{isAdmin ? "مدير النظام" : "مشرف"}</div>
          <form action={logout} className="mt-3">
            <button type="submit" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
