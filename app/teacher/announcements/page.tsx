import { TeacherLayout } from "@/components/layouts";
import { Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { createTeacherAnnouncementAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherAnnouncementsPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const workshops = await prisma.workshop.findMany({ where: { id: { in: workshopIds } }, orderBy: { sortOrder: "asc" } });
  const announcements = await prisma.announcement.findMany({
    where: { createdByUserId: teacher.id },
    include: { workshop: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Duyuru Yayınlama</h1>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr]">
        <Card>
          <CardTitle>Yeni Duyuru</CardTitle>
          <form action={createTeacherAnnouncementAction} className="grid gap-4">
            <Input label="Başlık" name="title" required />
            <Textarea label="İçerik" name="content" required />
            <Select label="Atölye" name="workshopId" required>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <Button>Yayınla</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Duyurularım</CardTitle>
          {announcements.length ? (
            <Table headers={["Başlık", "Atölye", "Tarih"]}>
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{announcement.title}</td>
                  <td className="px-3 py-3 text-slate-600">{announcement.workshop?.name ?? "Genel"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDateTime(announcement.createdAt)}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Duyuru yok" />
          )}
        </Card>
      </div>
    </TeacherLayout>
  );
}
