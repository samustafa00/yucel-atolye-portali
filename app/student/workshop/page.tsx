import { GraduationCap } from "lucide-react";
import { StudentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, ProgressBar } from "@/components/ui";
import { prisma } from "@/lib/db";
import { percent } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentWorkshopPage() {
  const student = await requireStudent();
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, status: "active" },
    include: {
      workshop: {
        include: {
          curriculum: { orderBy: { weekNumber: "asc" } },
          permissions: { include: { teacher: true } }
        }
      }
    }
  });
  const submissions = await prisma.assignmentSubmission.findMany({ where: { studentId: student.id } });
  const progress = percent(submissions.filter((submission) => submission.status === "graded").length, Math.max(submissions.length, 1));

  return (
    <StudentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Atölyem</h1>
      {!enrollment ? (
        <EmptyState title="Aktif atölye kaydı yok">Kaydın yapıldığında 8 haftalık müfredat burada görünecek.</EmptyState>
      ) : (
        <div className="grid gap-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge tone="blue">{enrollment.workshop.name}</Badge>
                <h2 className="mt-3 text-2xl font-black text-ink">{enrollment.workshop.name}</h2>
                <p className="mt-2 max-w-3xl leading-7 text-slate-600">{enrollment.workshop.shortDescription}</p>
              </div>
              <div className="min-w-48">
                <p className="mb-2 text-sm font-semibold text-slate-600">İlerleme %{progress}</p>
                <ProgressBar value={progress} />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Öğretmenler</CardTitle>
            <div className="flex flex-wrap gap-2">
              {enrollment.workshop.permissions.map((permission) => (
                <Badge key={permission.id} tone="green">
                  <GraduationCap className="mr-1 h-3.5 w-3.5" />
                  {permission.teacher.firstName} {permission.teacher.lastName}
                </Badge>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>8 Haftalık Müfredat</CardTitle>
            <div className="grid gap-3">
              {enrollment.workshop.curriculum.map((week) => (
                <div key={week.id} className="rounded-lg border border-slate-200 p-4">
                  <Badge tone="slate">{week.weekNumber}. Hafta</Badge>
                  <h3 className="mt-2 font-bold text-ink">{week.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{week.description}</p>
                  <p className="mt-2 text-sm text-slate-600"><strong>Görev:</strong> {week.homeworkSuggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </StudentLayout>
  );
}
