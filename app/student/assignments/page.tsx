import Link from "next/link";
import { StudentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, Table } from "@/components/ui";
import { submissionLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentAssignmentsPage() {
  const student = await requireStudent();
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
    include: { assignment: { include: { workshop: true } } },
    orderBy: { assignment: { dueDate: "asc" } }
  });

  return (
    <StudentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Ödevlerim</h1>
      <Card>
        <CardTitle>Atanan Ödevler</CardTitle>
        {submissions.length ? (
          <Table headers={["Ödev", "Atölye", "Son Teslim", "Durum", "Elmas", ""]}>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-3 py-3 font-semibold text-ink">{submission.assignment.title}</td>
                <td className="px-3 py-3 text-slate-600">{submission.assignment.workshop.name}</td>
                <td className="px-3 py-3 text-slate-600">{formatDate(submission.assignment.dueDate)}</td>
                <td className="px-3 py-3"><Badge tone={submission.status === "graded" ? "green" : "amber"}>{submissionLabels[submission.status]}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{submission.assignment.diamondReward}</td>
                <td className="px-3 py-3 text-right">
                  <Link className="font-semibold text-leaf" href={`/student/assignments/${submission.assignmentId}`}>Aç</Link>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Atanmış ödev yok" />
        )}
      </Card>
    </StudentLayout>
  );
}
