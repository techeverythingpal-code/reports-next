import { NotPorted } from "@/components/not-ported";
import { requireUser } from "@/lib/session";

export default async function TeachersPage() {
  await requireUser();
  return (
    <NotPorted
      title="👩‍🏫 المعلمون"
      laravelFiles={[
        "TeacherInfoController.php",
        "TeacherGradeController.php",
        "views/teachers/*",
        "views/grades/*",
        "js/pages/supervisor-dashboard.js",
      ]}
    />
  );
}
