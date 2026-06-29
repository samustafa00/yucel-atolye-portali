import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table } from "@/components/ui";
import { adminTakeAttendanceAction } from "@/lib/actions";
import { attendanceLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { fullName, formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminAttendancePage() {
  await requireAdmin();
  const [workshops, students, attendance] = await Promise.all([
    prisma.workshop.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ where: { role: "student" }, orderBy: { firstName: "asc" } }),
    prisma.attendance.findMany({ include: { student: true, workshop: true }, orderBy: { date: "desc" }, take: 50 })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Yoklama Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Yoklama Ekle/Düzelt</CardTitle>
          <form action={adminTakeAttendanceAction} className="grid gap-4">
            <Select label="Atölye" name="workshopId">{workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}</Select>
            <Select label="Öğrenci" name="studentId">
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {fullName(student)} • {student.schoolNumber} • {student.gradeLevel && student.branch ? `${student.gradeLevel}/${student.branch}` : "Sınıf yok"}
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
            <Button>Kaydet</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Yoklama Kayıtları</CardTitle>
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
    </AdminLayout>
  );
}
