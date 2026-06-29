import { ClipboardCheck, Gem, Medal, UserCheck } from "lucide-react";
import { ParentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, ProgressBar, StatCard } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fullName, percent } from "@/lib/format";
import { requireParentStudent } from "@/lib/session";

export default async function ParentDashboardPage() {
  const student = await requireParentStudent();
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, status: "active" },
    include: { workshop: true }
  });
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
    include: { assignment: true }
  });
  const rewards = await prisma.studentReward.findMany({
    where: { studentId: student.id },
    include: { reward: true }
  });
  const attendance = await prisma.attendance.findMany({ where: { studentId: student.id } });
  const notes = await prisma.teacherNote.findMany({
    where: { studentId: student.id },
    include: { teacher: true, workshop: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const completed = submissions.filter((item) => item.status === "graded").length;
  const pending = submissions.length - completed;
  const progress = percent(completed, Math.max(submissions.length, 1));
  const present = attendance.filter((item) => item.status === "present" || item.status === "late").length;

  return (
    <ParentLayout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf">Çocuğumun Genel Durumu</p>
        <h1 className="text-3xl font-black text-ink">{fullName(student)}</h1>
        <p className="text-slate-600">Okul no: {student.schoolNumber} • Sınıf/Şube: {student.gradeLevel && student.branch ? `${student.gradeLevel}/${student.branch}` : "-"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Atölye" value={enrollment?.workshop.name ?? "-"} icon={<UserCheck className="h-5 w-5" />} tone="bg-sky-100" />
        <StatCard label="Toplam Elmas" value={student.diamondBalance} icon={<Gem className="h-5 w-5" />} tone="bg-amber-100" />
        <StatCard label="Tamamlanan" value={completed} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-emerald-100" />
        <StatCard label="Rozet" value={rewards.length} icon={<Medal className="h-5 w-5" />} tone="bg-rose-100" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardTitle>Genel İlerleme</CardTitle>
          <ProgressBar value={progress} />
          <p className="mt-3 text-sm text-slate-600">%{progress} ödev ilerlemesi, {pending} bekleyen ödev, {present} devam kaydı.</p>
        </Card>
        <Card>
          <CardTitle>Aktif Madalya/Rozet</CardTitle>
          {rewards.length ? (
            <div className="flex flex-wrap gap-2">
              {rewards.map((item) => (
                <Badge key={item.id} tone={item.status === "active" ? "green" : "amber"}>{item.reward.name}</Badge>
              ))}
            </div>
          ) : (
            <EmptyState title="Henüz rozet yok" />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>Öğretmen Notları</CardTitle>
        {notes.length ? (
          <div className="grid gap-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">{note.note}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {note.teacher ? fullName(note.teacher) : "Öğretmen"} {note.workshop ? `• ${note.workshop.name}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Not yok" />
        )}
      </Card>
    </ParentLayout>
  );
}
