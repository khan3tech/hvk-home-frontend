import { redirect } from "next/navigation";

/** Keep older links working; the current admin exam route is plural. */
export default function AdminExamAliasPage() {
  redirect("/admin/exams");
}
