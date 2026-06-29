import { notFound } from "next/navigation";
import { StudentLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, Textarea } from "@/components/ui";
import { submissionLabels } from "@/lib/constants";
import { submitAssignmentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await requireStudent();
  const { id } = await params;
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
    include: { assignment: { include: { workshop: true } } }
  });
  if (!submission) notFound();

  const locked = submission.status === "graded";

  return (
    <StudentLayout>
      <div className="mb-6">
        <Badge tone="blue">{submission.assignment.workshop.name}</Badge>
        <h1 className="mt-3 text-3xl font-black text-ink">{submission.assignment.title}</h1>
        <p className="mt-2 text-slate-600">Son teslim: {formatDate(submission.assignment.dueDate)}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardTitle>Ödev Açıklaması</CardTitle>
          <p className="whitespace-pre-line leading-7 text-slate-600">{submission.assignment.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="amber">{submission.assignment.diamondReward} elmas</Badge>
            <Badge>{submission.assignment.maxScore} puan</Badge>
            <Badge tone={locked ? "green" : "amber"}>{submissionLabels[submission.status]}</Badge>
          </div>
        </Card>
        <Card>
          <CardTitle>Cevabım</CardTitle>
          <form action={submitAssignmentAction} className="grid gap-4">
            <input type="hidden" name="assignmentId" value={submission.assignmentId} />
            <Textarea label="Metin cevabı" name="answerText" defaultValue={submission.answerText ?? ""} disabled={locked} required />
            {submission.feedback ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <strong>Öğretmen geri bildirimi:</strong> {submission.feedback}
              </div>
            ) : null}
            <Button disabled={locked}>{locked ? "Değerlendirildi" : "Gönder"}</Button>
          </form>
        </Card>
      </div>
    </StudentLayout>
  );
}
