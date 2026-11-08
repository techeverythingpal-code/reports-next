import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { directorates, schools } from "@/db/schema";
import { xlsxResponse } from "@/lib/excel";
import { requireAdmin } from "@/lib/session";

// GET /schools/export: same columns as the Laravel export, so files can be re-imported.
export async function GET() {
  await requireAdmin();
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      directorateId: schools.directorateId,
      directorate: directorates.name,
    })
    .from(schools)
    .leftJoin(directorates, eq(directorates.id, schools.directorateId))
    .orderBy(asc(schools.id));

  return xlsxResponse(
    ["School_ID", "SchoolName", "directorate_id", "Directorate_Name"],
    rows.map((r) => [r.id, r.name, r.directorateId, r.directorate ?? ""]),
    "schools_export",
  );
}
