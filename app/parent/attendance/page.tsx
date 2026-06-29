import { ParentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, Table } from "@/components/ui";
import { attendanceLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireParentStudent } from "@/lib/session";

export default async function ParentAttendancePage() {
  const student = await requireParentStudent();
  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: { workshop: true, teacher: true },
    orderBy: [{ date: "desc" }]
  });

  return (
    <ParentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Yoklama Durumu</h1>
      <Card>
        <CardTitle>Devam Kayıtları</CardTitle>
        {attendance.length ? (
          <Table headers={["Tarih", "Atölye", "Hafta", "Durum", "Not"]}>
            {attendance.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-slate-600">{formatDate(item.date)}</td>
                <td className="px-3 py-3 font-semibold text-ink">{item.workshop.name}</td>
                <td className="px-3 py-3 text-slate-600">{item.weekNumber}</td>
                <td className="px-3 py-3"><Badge tone={item.status === "present" ? "green" : "amber"}>{attendanceLabels[item.status]}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{item.note ?? "-"}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Yoklama kaydı yok" />
        )}
      </Card>
    </ParentLayout>
  );
}
