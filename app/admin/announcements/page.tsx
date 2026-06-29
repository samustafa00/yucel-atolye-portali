import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { adminCreateAnnouncementAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const [workshops, announcements] = await Promise.all([
    prisma.workshop.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.announcement.findMany({ include: { workshop: true, createdByUser: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Duyuru Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Duyuru Oluştur</CardTitle>
          <form action={adminCreateAnnouncementAction} className="grid gap-4">
            <Input label="Başlık" name="title" required />
            <Textarea label="İçerik" name="content" required />
            <Select label="Hedef kitle" name="targetType">
              <option value="all">Herkes</option>
              <option value="students">Öğrenciler</option>
              <option value="parents">Veliler</option>
              <option value="teachers">Öğretmenler</option>
              <option value="workshop">Belirli atölye</option>
            </Select>
            <Select label="Atölye" name="workshopId">
              <option value="">Genel</option>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" name="isPublished" defaultChecked />
              Yayında
            </label>
            <Button>Oluştur</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Duyurular</CardTitle>
          {announcements.length ? (
            <Table headers={["Başlık", "Hedef", "Atölye", "Yayın", "Tarih"]}>
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{announcement.title}</td>
                  <td className="px-3 py-3 text-slate-600">{announcement.targetType}</td>
                  <td className="px-3 py-3 text-slate-600">{announcement.workshop?.name ?? "-"}</td>
                  <td className="px-3 py-3"><Badge tone={announcement.isPublished ? "green" : "amber"}>{announcement.isPublished ? "Yayında" : "Taslak"}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(announcement.createdAt)}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Duyuru yok" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
