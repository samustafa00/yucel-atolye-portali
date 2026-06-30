import { ParentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, Table } from "@/components/ui";
import { submissionLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireParentStudent } from "@/lib/session";

export default async function ParentAssignmentsPage() {
  const student = await requireParentStudent();
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
    include: { assignment: { include: { workshop: true } } },
    orderBy: { assignment: { dueDate: "asc" } }
  });

  return (
    <ParentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Ödev Durumu</h1>
      <Card>
        <CardTitle>Ödevler</CardTitle>
        {submissions.length ? (
          <Table headers={["Ödev", "Atölye", "Son Teslim", "Durum", "Görsel", "Puan", "Geri Bildirim", "Elmas"]}>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-3 py-3 font-semibold text-ink">{submission.assignment.title}</td>
                <td className="px-3 py-3 text-slate-600">{submission.assignment.workshop.name}</td>
                <td className="px-3 py-3 text-slate-600">{formatDate(submission.assignment.dueDate)}</td>
                <td className="px-3 py-3"><Badge tone={submission.status === "graded" ? "green" : "amber"}>{submissionLabels[submission.status]}</Badge></td>
                <td className="px-3 py-3">
                  {submission.fileUrl ? (
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-leaf">
                      Görüntüle
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-600">{submission.score ?? "-"}</td>
                <td className="px-3 py-3 text-slate-600">{submission.feedback ?? "-"}</td>
                <td className="px-3 py-3 text-slate-600">{submission.assignment.diamondReward}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Ödev yok" />
        )}
      </Card>
    </ParentLayout>
  );
}
