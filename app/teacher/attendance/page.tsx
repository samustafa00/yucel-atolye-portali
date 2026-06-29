import { TeacherLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table } from "@/components/ui";
import { attendanceLabels } from "@/lib/constants";
import { takeAttendanceAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName, formatDate } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherAttendancePage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const workshops = await prisma.workshop.findMany({ where: { id: { in: workshopIds } }, orderBy: { sortOrder: "asc" } });
  const enrollments = await prisma.enrollment.findMany({
    where: { workshopId: { in: workshopIds }, status: "active" },
    include: { student: true, workshop: true },
    orderBy: { createdAt: "desc" }
  });
  const attendance = await prisma.attendance.findMany({
    where: { workshopId: { in: workshopIds } },
    include: { student: true, workshop: true },
    orderBy: { date: "desc" },
    take: 30
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Yoklama Alma</h1>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr]">
        <Card>
          <CardTitle>Yeni Yoklama</CardTitle>
          <form action={takeAttendanceAction} className="grid gap-4">
            <Select label="Atölye" name="workshopId" required>
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <Select label="Öğrenci" name="studentId" required>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.studentId}>
                  {fullName(enrollment.student)} • {enrollment.student.gradeLevel && enrollment.student.branch ? `${enrollment.student.gradeLevel}/${enrollment.student.branch}` : "Sınıf yok"} • {enrollment.workshop.name}
                </option>
              ))}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Hafta" name="weekNumber" type="number" min="1" max="8" defaultValue="1" />
              <Input label="Tarih" name="date" type="date" />
            </div>
            <Select label="Durum" name="status">
              <option value="present">Geldi</option>
              <option value="absent">Gelmedi</option>
              <option value="late">Geç geldi</option>
              <option value="excused">Mazeretli</option>
            </Select>
            <Input label="Not" name="note" />
            <Button>Yoklama Kaydet</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Son Kayıtlar</CardTitle>
          {attendance.length ? (
            <Table headers={["Tarih", "Öğrenci", "Atölye", "Hafta", "Durum"]}>
              {attendance.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 text-slate-600">{formatDate(item.date)}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(item.student)}</td>
                  <td className="px-3 py-3 text-slate-600">{item.workshop.name}</td>
                  <td className="px-3 py-3 text-slate-600">{item.weekNumber}</td>
                  <td className="px-3 py-3"><Badge tone={item.status === "present" ? "green" : "amber"}>{attendanceLabels[item.status]}</Badge></td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Yoklama kaydı yok" />
          )}
        </Card>
      </div>
    </TeacherLayout>
  );
}
