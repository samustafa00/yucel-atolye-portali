import { ConfirmButton } from "@/components/confirm-button";
import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { adminCreateCurriculumAction, adminDeleteCurriculumAction, adminUpdateCurriculumAction } from "@/lib/actions";
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
        <Card>
          <CardTitle>Yeni Müfredat Haftası</CardTitle>
          <form action={adminCreateCurriculumAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <Select label="Atölye" name="workshopId" required>
                {workshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </option>
                ))}
              </Select>
              <Input label="Hafta" name="weekNumber" type="number" min="1" defaultValue="1" required />
            </div>
            <Input label="Başlık" name="title" required />
            <Textarea label="Açıklama" name="description" required />
            <Textarea label="Kazanımlar" name="outcomes" />
            <Textarea label="Etkinlik" name="activity" />
            <Textarea label="Mini görev" name="homeworkSuggestion" />
            <Button>Hafta Ekle/Güncelle</Button>
          </form>
        </Card>

        {workshops.map((workshop) => (
          <Card key={workshop.id}>
            <CardTitle>{workshop.name}</CardTitle>
            {workshop.curriculum.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {workshop.curriculum.map((week) => (
                  <div key={week.id} className="rounded-lg border border-slate-200 p-4">
                    <Badge>{week.weekNumber}. Hafta</Badge>
                    <form action={adminUpdateCurriculumAction} className="mt-3 grid gap-3">
                      <input type="hidden" name="curriculumId" value={week.id} />
                      <Input label="Hafta" name="weekNumber" type="number" min="1" defaultValue={week.weekNumber} required />
                      <Input label="Başlık" name="title" defaultValue={week.title} required />
                      <Textarea label="Açıklama" name="description" defaultValue={week.description} required />
                      <Textarea label="Kazanımlar" name="outcomes" defaultValue={week.outcomes} />
                      <Textarea label="Etkinlik" name="activity" defaultValue={week.activity} />
                      <Textarea label="Mini görev" name="homeworkSuggestion" defaultValue={week.homeworkSuggestion} />
                      <Button variant="secondary">Güncelle</Button>
                    </form>
                    <form action={adminDeleteCurriculumAction} className="mt-2">
                      <input type="hidden" name="curriculumId" value={week.id} />
                      <ConfirmButton
                        variant="danger"
                        className="flex w-full"
                        message={`${workshop.name} ${week.weekNumber}. hafta müfredatını silmek istediğinize emin misiniz?`}
                      >
                        Haftayı Sil
                      </ConfirmButton>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Bu atölyede müfredat haftası yok" />
            )}
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
