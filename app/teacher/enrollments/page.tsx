import { TeacherLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table } from "@/components/ui";
import { enrollStudentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherEnrollmentsPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const workshops = await prisma.workshop.findMany({
    where: { id: { in: workshopIds } },
    orderBy: { sortOrder: "asc" }
  });
  const enrollments = await prisma.enrollment.findMany({
    where: { workshopId: { in: workshopIds } },
    include: { student: true, workshop: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Öğrenci Atölye Kaydı</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Yeni Kayıt</CardTitle>
          <form action={enrollStudentAction} className="grid gap-4">
            <Input label="Öğrenci okul numarası" name="schoolNumber" required />
            <Select label="Atölye" name="workshopId" required>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" name="allowWaitlist" />
              Kontenjan doluysa bekleme listesine al
            </label>
            <Button>Kaydet</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Kayıt Geçmişi</CardTitle>
          {enrollments.length ? (
            <Table headers={["Öğrenci", "Okul No", "Sınıf/Şube", "Atölye", "Durum"]}>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(enrollment.student)}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.student.schoolNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.student.gradeLevel && enrollment.student.branch ? `${enrollment.student.gradeLevel}/${enrollment.student.branch}` : "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.workshop.name}</td>
                  <td className="px-3 py-3"><Badge tone={enrollment.status === "active" ? "green" : "amber"}>{enrollment.status}</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Kayıt yok" />
          )}
        </Card>
      </div>
    </TeacherLayout>
  );
}
