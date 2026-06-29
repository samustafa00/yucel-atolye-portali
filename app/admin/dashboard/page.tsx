import { ClipboardCheck, Gem, GraduationCap, Rocket, Shield, Users } from "lucide-react";
import { AdminLayout } from "@/components/layouts";
import { Card, CardTitle, StatCard, Table } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [
    studentCount,
    teacherCount,
    workshopCount,
    activeEnrollments,
    pendingTeachers,
    pendingRewards,
    assignmentCount,
    submittedCount,
    logs
  ] = await Promise.all([
    prisma.user.count({ where: { role: "student" } }),
    prisma.user.count({ where: { role: "teacher" } }),
    prisma.workshop.count(),
    prisma.enrollment.count({ where: { status: "active" } }),
    prisma.user.count({ where: { role: "teacher", isApproved: false } }),
    prisma.studentReward.count({ where: { status: "pending" } }),
    prisma.assignment.count(),
    prisma.assignmentSubmission.count({ where: { status: { in: ["submitted", "graded", "late"] } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Öğrenci" value={studentCount} icon={<Users className="h-5 w-5" />} tone="bg-sky-100" />
        <StatCard label="Öğretmen" value={teacherCount} icon={<GraduationCap className="h-5 w-5" />} tone="bg-emerald-100" />
        <StatCard label="Atölye" value={workshopCount} icon={<Rocket className="h-5 w-5" />} tone="bg-amber-100" />
        <StatCard label="Aktif Kayıt" value={activeEnrollments} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-rose-100" />
        <StatCard label="Öğretmen Onayı" value={pendingTeachers} icon={<Shield className="h-5 w-5" />} tone="bg-indigo-100" />
        <StatCard label="Ödül Onayı" value={pendingRewards} icon={<Gem className="h-5 w-5" />} tone="bg-lime-100" />
        <StatCard label="Ödev" value={assignmentCount} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-slate-100" />
        <StatCard label="Teslim" value={submittedCount} icon={<Shield className="h-5 w-5" />} tone="bg-cyan-100" />
      </div>

      <Card className="mt-6">
        <CardTitle>Son Sistem Hareketleri</CardTitle>
        <Table headers={["Tarih", "Kullanıcı", "İşlem", "Açıklama"]}>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-3 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
              <td className="px-3 py-3 text-slate-600">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem"}</td>
              <td className="px-3 py-3 font-semibold text-ink">{log.action}</td>
              <td className="px-3 py-3 text-slate-600">{log.description}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminLayout>
  );
}
