import { asc } from "drizzle-orm";
import { db } from "@/db";
import { supervisors } from "@/db/schema";
import { xlsxResponse } from "@/lib/excel";
import { requireAdmin } from "@/lib/session";

// GET /supervisors/export: same columns as the Laravel export. Never includes passwords.
export async function GET() {
  await requireAdmin();
  const rows = await db
    .select({
      id: supervisors.id,
      name: supervisors.name,
      major: supervisors.major,
      directorateId: supervisors.directorateId,
      role: supervisors.role,
    })
    .from(supervisors)
    .orderBy(asc(supervisors.id));

  return xlsxResponse(
    ["SuperVisor_id", "SuperVisor_Name", "SuperVisor_Major", "directorate_id", "role"],
    rows.map((r) => [r.id, r.name, r.major, r.directorateId, r.role]),
    "supervisors_export",
  );
}
