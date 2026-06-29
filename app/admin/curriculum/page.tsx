import { AdminLayout } from "@/components/layouts";
import { Badge, Card, CardTitle } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminCurriculumPage() {
  await requireAdmin();
  const workshops = await prisma.workshop.findMany({
    include: { curriculum: { orderBy: { weekNumber: "asc" } } },
    orderBy: { sortOrder: "asc" }
  });

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Müfredat Yönetimi</h1>
      <div className="grid gap-6">
        {workshops.map((workshop) => (
          <Card key={workshop.id}>
            <CardTitle>{workshop.name}</CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {workshop.curriculum.map((week) => (
                <div key={week.id} className="rounded-lg border border-slate-200 p-4">
                  <Badge>{week.weekNumber}. Hafta</Badge>
                  <h3 className="mt-2 font-bold text-ink">{week.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{week.description}</p>
                  <p className="mt-2 text-sm text-slate-600"><strong>Etkinlik:</strong> {week.activity}</p>
                  <p className="mt-1 text-sm text-slate-600"><strong>Ödev:</strong> {week.homeworkSuggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
