import { AdminLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, Table } from "@/components/ui";
import { prisma } from "@/lib/db";
import { percent } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminReportsPage() {
  await requireAdmin();
  const [workshops, topStudents, totalSubmissions, gradedSubmissions, pendingEvaluations, rewardOwners] = await Promise.all([
    prisma.workshop.findMany({
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "active" } },
            assignments: true,
            attendances: true
          }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.user.findMany({ where: { role: "student" }, orderBy: { diamondBalance: "desc" }, take: 10 }),
    prisma.assignmentSubmission.count(),
    prisma.assignmentSubmission.count({ where: { status: "graded" } }),
    prisma.assignmentSubmission.count({ where: { status: { in: ["submitted", "late"] } } }),
    prisma.studentReward.findMany({ include: { student: true, reward: true }, orderBy: { purchasedAt: "desc" }, take: 10 })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Raporlama</h1>
      <div className="grid gap-6">
        <Card>
          <CardTitle>Atölye Bazlı Öğrenci ve Doluluk</CardTitle>
          <Table headers={["Atölye", "Öğrenci", "Kontenjan", "Doluluk", "Ödev", "Yoklama"]}>
            {workshops.map((workshop) => (
              <tr key={workshop.id}>
                <td className="px-3 py-3 font-semibold text-ink">{workshop.name}</td>
                <td className="px-3 py-3 text-slate-600">{workshop._count.enrollments}</td>
                <td className="px-3 py-3 text-slate-600">{workshop.capacity}</td>
                <td className="px-3 py-3"><Badge tone="blue">%{percent(workshop._count.enrollments, workshop.capacity)}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{workshop._count.assignments}</td>
                <td className="px-3 py-3 text-slate-600">{workshop._count.attendances}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Ödev Tamamlama</CardTitle>
            <p className="text-4xl font-black text-ink">%{percent(gradedSubmissions, totalSubmissions)}</p>
            <p className="text-sm text-slate-600">{gradedSubmissions}/{totalSubmissions} teslim değerlendirildi. Bekleyen değerlendirme: {pendingEvaluations}</p>
          </Card>
          <Card>
            <CardTitle>En Çok Elmas Kazananlar</CardTitle>
            <Table headers={["Öğrenci", "Okul No", "Elmas"]}>
              {topStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{student.firstName} {student.lastName}</td>
                  <td className="px-3 py-3 text-slate-600">{student.schoolNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{student.diamondBalance}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <Card>
          <CardTitle>Rozet Kazanan Öğrenciler</CardTitle>
          <Table headers={["Öğrenci", "Ödül", "Durum"]}>
            {rewardOwners.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 font-semibold text-ink">{item.student.firstName} {item.student.lastName}</td>
                <td className="px-3 py-3 text-slate-600">{item.reward.name}</td>
                <td className="px-3 py-3"><Badge tone={item.status === "active" ? "green" : "amber"}>{item.status}</Badge></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
