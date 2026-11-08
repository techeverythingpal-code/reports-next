import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { createDirectorate } from "../actions";
import { DirectorateForm } from "../directorate-form";

export const metadata: Metadata = { title: "إضافة مديرية" };

export default async function NewDirectoratePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">إضافة مديرية</h1>
      <DirectorateForm action={createDirectorate} />
    </div>
  );
}
