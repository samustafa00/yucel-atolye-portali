import { ConfirmButton } from "@/components/confirm-button";
import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { adminCreateAnnouncementAction, adminDeleteAnnouncementAction, adminUpdateAnnouncementAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

const targetOptions = [
  ["all", "Herkes"],
  ["students", "Öğrenciler"],
  ["parents", "Veliler"],
  ["teachers", "Öğretmenler"],
  ["workshop", "Belirli atölye"]
] as const;

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
              {targetOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select label="Atölye" name="workshopId">
              <option value="">Genel</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </option>
              ))}
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
            <Table headers={["Başlık", "Hedef", "Yayın", "Tarih", "İşlem"]}>
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="align-top">
                  <td className="px-3 py-3 font-semibold text-ink">{announcement.title}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {announcement.targetType}
                    <br />
                    <span className="text-xs text-slate-400">{announcement.workshop?.name ?? "Genel"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={announcement.isPublished ? "green" : "amber"}>{announcement.isPublished ? "Yayında" : "Taslak"}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(announcement.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="grid min-w-80 gap-2">
                      <form action={adminUpdateAnnouncementAction} className="grid gap-2">
                        <input type="hidden" name="announcementId" value={announcement.id} />
                        <Input label="Başlık" name="title" defaultValue={announcement.title} required />
                        <Textarea label="İçerik" name="content" defaultValue={announcement.content} required />
                        <Select label="Hedef kitle" name="targetType" defaultValue={announcement.targetType}>
                          {targetOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <Select label="Atölye" name="workshopId" defaultValue={announcement.workshopId ?? ""}>
                          <option value="">Genel</option>
                          {workshops.map((workshop) => (
                            <option key={workshop.id} value={workshop.id}>
                              {workshop.name}
                            </option>
                          ))}
                        </Select>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <input type="checkbox" name="isPublished" defaultChecked={announcement.isPublished} />
                          Yayında
                        </label>
                        <Button variant="secondary">Güncelle</Button>
                      </form>
                      <form action={adminDeleteAnnouncementAction}>
                        <input type="hidden" name="announcementId" value={announcement.id} />
                        <ConfirmButton
                          variant="danger"
                          className="flex w-full"
                          message={`${announcement.title} duyurusunu silmek istediğinize emin misiniz?`}
                        >
                          Duyuruyu Sil
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
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
