import { TeacherLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { submissionLabels } from "@/lib/constants";
import { gradeSubmissionAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName, formatDate } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherSubmissionsPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignment: { workshopId: { in: workshopIds } } },
    include: { assignment: { include: { workshop: true } }, student: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Ödev Değerlendirme</h1>
      <Card>
        <CardTitle>Teslimler</CardTitle>
        {submissions.length ? (
          <Table headers={["Öğrenci", "Ödev", "Durum", "Teslim", "Cevap", "Değerlendir"]}>
            {submissions.map((submission) => (
              <tr key={submission.id} className="align-top">
                <td className="px-3 py-3 font-semibold text-ink">{fullName(submission.student)}</td>
                <td className="px-3 py-3 text-slate-600">{submission.assignment.title}<br /><span className="text-xs">{submission.assignment.workshop.name}</span></td>
                <td className="px-3 py-3"><Badge tone={submission.status === "graded" ? "green" : "amber"}>{submissionLabels[submission.status]}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{formatDate(submission.submittedAt)}</td>
                <td className="max-w-sm px-3 py-3 text-slate-600">{submission.answerText ?? "-"}</td>
                <td className="px-3 py-3">
                  <form action={gradeSubmissionAction} className="grid min-w-72 gap-2">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Puan" name="score" type="number" min="0" max={submission.assignment.maxScore} defaultValue={submission.score ?? 100} />
                      <Input label="Ek elmas" name="extraDiamonds" type="number" min="0" defaultValue="0" />
                    </div>
                    <Select label="Durum" name="status" defaultValue={submission.status === "late" ? "late" : "graded"}>
                      <option value="graded">Başarılı</option>
                      <option value="needs_revision">Tekrar yapmalı</option>
                      <option value="late">Geç teslim</option>
                    </Select>
                    <Textarea label="Geri bildirim" name="feedback" defaultValue={submission.feedback ?? ""} />
                    <Button>Kaydet</Button>
                  </form>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Teslim yok" />
        )}
      </Card>
    </TeacherLayout>
  );
}
