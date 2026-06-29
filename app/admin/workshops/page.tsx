import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, Input, Textarea } from "@/components/ui";
import { adminCreateWorkshopAction, adminUpdateWorkshopAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminWorkshopsPage() {
  await requireAdmin();
  const workshops = await prisma.workshop.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { enrollments: { where: { status: "active" } } } } }
  });

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Atölye Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Atölye Ekle</CardTitle>
          <form action={adminCreateWorkshopAction} className="grid gap-4">
            <Input label="Atölye adı" name="name" required />
            <Textarea label="Kısa açıklama" name="shortDescription" required />
            <Textarea label="Detaylı açıklama" name="description" />
            <Textarea label="Kimler için uygun?" name="suitableFor" />
            <Textarea label="Kazanımlar" name="outcomes" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Kontenjan" name="capacity" type="number" defaultValue="24" />
              <Input label="Sıralama" name="sortOrder" type="number" defaultValue="99" />
            </div>
            <Button>Atölye Oluştur</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          {workshops.map((workshop) => (
            <Card key={workshop.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={workshop.isActive ? "green" : "red"}>{workshop.isActive ? "Aktif" : "Pasif"}</Badge>
                  <h2 className="mt-2 text-xl font-black text-ink">{workshop.name}</h2>
                  <p className="text-sm text-slate-600">{workshop._count.enrollments}/{workshop.capacity} kontenjan</p>
                </div>
              </div>
              <form action={adminUpdateWorkshopAction} className="grid gap-3">
                <input type="hidden" name="workshopId" value={workshop.id} />
                <Textarea label="Kısa açıklama" name="shortDescription" defaultValue={workshop.shortDescription} />
                <Input label="Kontenjan" name="capacity" type="number" defaultValue={workshop.capacity} />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="checkbox" name="isActive" defaultChecked={workshop.isActive} />
                  Aktif
                </label>
                <Button variant="secondary">Güncelle</Button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
