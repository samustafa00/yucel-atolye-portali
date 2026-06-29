import { TeacherLayout } from "@/components/layouts";
import { Button, Card, CardTitle, Input, Select, Textarea } from "@/components/ui";
import { createAssignmentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function NewTeacherAssignmentPage() {
  const teacher = await requireTeacher();
  const workshops = await prisma.workshop.findMany({
    where: { id: { in: await teacherWorkshopIds(teacher.id) } },
    orderBy: { sortOrder: "asc" }
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Yeni Ödev</h1>
      <Card className="max-w-2xl">
        <CardTitle>Ödev Bilgileri</CardTitle>
        <form action={createAssignmentAction} className="grid gap-4">
          <Input label="Başlık" name="title" required />
          <Textarea label="Açıklama" name="description" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Atölye" name="workshopId" required>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <Input label="Hafta" name="weekNumber" type="number" min="1" max="8" defaultValue="1" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Son teslim" name="dueDate" type="date" required />
            <Input label="Elmas" name="diamondReward" type="number" min="0" defaultValue="20" />
            <Input label="Maks. puan" name="maxScore" type="number" min="1" defaultValue="100" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" name="requiresFile" />
            Dosya yükleme gerekli
          </label>
          <Button>Ödevi Yayınla</Button>
        </form>
      </Card>
    </TeacherLayout>
  );
}
