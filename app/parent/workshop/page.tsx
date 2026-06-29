import { ParentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, ProgressBar } from "@/components/ui";
import { prisma } from "@/lib/db";
import { percent } from "@/lib/format";
import { requireParentStudent } from "@/lib/session";

export default async function ParentWorkshopPage() {
  const student = await requireParentStudent();
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
  const progress = percent(submissions.filter((item) => item.status === "graded").length, Math.max(submissions.length, 1));

  return (
    <ParentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Atölye Bilgisi</h1>
      {!enrollment ? (
        <EmptyState title="Atölye kaydı yok" />
      ) : (
        <div className="grid gap-6">
          <Card>
            <Badge tone="blue">{enrollment.workshop.name}</Badge>
            <h2 className="mt-3 text-2xl font-black text-ink">{enrollment.workshop.name}</h2>
            <p className="mt-2 leading-7 text-slate-600">{enrollment.workshop.shortDescription}</p>
            <div className="mt-5 max-w-sm">
              <p className="mb-2 text-sm font-semibold text-slate-600">İlerleme %{progress}</p>
              <ProgressBar value={progress} />
            </div>
          </Card>
          <Card>
            <CardTitle>Müfredat</CardTitle>
            <div className="grid gap-3">
              {enrollment.workshop.curriculum.map((week) => (
                <div key={week.id} className="rounded-lg border border-slate-200 p-4">
                  <Badge>{week.weekNumber}. Hafta</Badge>
                  <h3 className="mt-2 font-bold text-ink">{week.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{week.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </ParentLayout>
  );
}
