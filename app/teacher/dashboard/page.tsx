import { ClipboardCheck, GraduationCap, Megaphone, Users } from "lucide-react";
import { TeacherLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, StatCard } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fullName, formatDate } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherDashboardPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const permissions = await prisma.teacherWorkshopPermission.findMany({
    where: { teacherId: teacher.id },
    include: { workshop: true }
  });
  const studentCount = await prisma.enrollment.count({
    where: { workshopId: { in: workshopIds }, status: "active" }
  });
  const pendingSubmissions = await prisma.assignmentSubmission.count({
    where: { status: { in: ["submitted", "late"] }, assignment: { workshopId: { in: workshopIds } } }
  });
  const assignments = await prisma.assignment.findMany({
    where: { workshopId: { in: workshopIds } },
    include: { workshop: true },
    orderBy: { dueDate: "asc" },
    take: 5
  });
  const announcements = await prisma.announcement.findMany({
    where: { createdByUserId: teacher.id },
    orderBy: { createdAt: "desc" },
    take: 4
  });

  return (
    <TeacherLayout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf">Öğretmen Paneli</p>
        <h1 className="text-3xl font-black text-ink">{fullName(teacher)}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Yetkili Atölye" value={permissions.length} icon={<GraduationCap className="h-5 w-5" />} tone="bg-sky-100" />
        <StatCard label="Öğrenci" value={studentCount} icon={<Users className="h-5 w-5" />} tone="bg-emerald-100" />
        <StatCard label="Bekleyen Değerlendirme" value={pendingSubmissions} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-amber-100" />
        <StatCard label="Duyuru" value={announcements.length} icon={<Megaphone className="h-5 w-5" />} tone="bg-rose-100" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Yetkili Atölyeler</CardTitle>
          {permissions.length ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => <Badge key={permission.id} tone="blue">{permission.workshop.name}</Badge>)}
            </div>
          ) : (
            <EmptyState title="Yetki yok">Admin panelinden atölye yetkisi verilmesi gerekir.</EmptyState>
          )}
        </Card>
        <Card>
          <CardTitle>Yaklaşan Ödevler</CardTitle>
          {assignments.length ? (
            <div className="grid gap-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-ink">{assignment.title}</p>
                  <p className="text-sm text-slate-500">{assignment.workshop.name} • {formatDate(assignment.dueDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Ödev yok" />
          )}
        </Card>
      </div>
    </TeacherLayout>
  );
}
