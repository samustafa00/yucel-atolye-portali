import { ClipboardCheck, Gem, KeyRound, Medal, Megaphone } from "lucide-react";
import { StudentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, ProgressBar, StatCard } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fullName, percent } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, status: "active" },
    include: { workshop: { include: { curriculum: true } } }
  });
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
    include: { assignment: { include: { workshop: true } } },
    orderBy: { createdAt: "desc" }
  });
  const rewards = await prisma.studentReward.findMany({
    where: { studentId: student.id },
    include: { reward: true },
    orderBy: { purchasedAt: "desc" }
  });
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      OR: [
        { targetType: "all" },
        { targetType: "students" },
        enrollment ? { targetType: "workshop", workshopId: enrollment.workshopId } : { id: "__none" }
      ]
    },
    orderBy: { publishedAt: "desc" },
    take: 4
  });
  const attendance = await prisma.attendance.findMany({ where: { studentId: student.id } });
  const parentAccessCode = await prisma.parentAccessCode.findFirst({
    where: { studentId: student.id, isActive: true },
    orderBy: { createdAt: "desc" }
  });

  const completed = submissions.filter((submission) => submission.status === "graded").length;
  const pending = submissions.filter((submission) => ["pending", "submitted", "late"].includes(submission.status)).length;
  const progress = percent(completed, Math.max(submissions.length, 1));
  const presentCount = attendance.filter((item) => item.status === "present" || item.status === "late").length;

  return (
    <StudentLayout>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf">Hoş geldin</p>
        <h1 className="text-3xl font-black text-ink">{fullName(student)}</h1>
        <p className="text-slate-600">Okul no: {student.schoolNumber} • Sınıf/Şube: {student.gradeLevel && student.branch ? `${student.gradeLevel}/${student.branch}` : "-"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Elmas" value={student.diamondBalance} icon={<Gem className="h-5 w-5" />} tone="bg-amber-100" />
        <StatCard label="Tamamlanan Ödev" value={completed} icon={<ClipboardCheck className="h-5 w-5" />} tone="bg-emerald-100" />
        <StatCard label="Bekleyen Ödev" value={pending} icon={<Megaphone className="h-5 w-5" />} tone="bg-sky-100" />
        <StatCard label="Rozet/Madalya" value={rewards.length} icon={<Medal className="h-5 w-5" />} tone="bg-rose-100" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardTitle>Veli Erişim Kodu</CardTitle>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-sm text-slate-500">Velin bu kod ve okul numaranla veli portalına giriş yapabilir.</p>
              <p className="mt-2 font-mono text-3xl font-black tracking-wide text-ink">
                {parentAccessCode?.code ?? "Kod oluşturulmamış"}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Atölye İlerlemesi</CardTitle>
          {enrollment ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{enrollment.workshop.name}</Badge>
                <span className="text-sm text-slate-500">{enrollment.workshop.curriculum.length} haftalık müfredat</span>
              </div>
              <ProgressBar value={progress} />
              <p className="text-sm text-slate-600">%{progress} ödev ilerlemesi, {presentCount} devam kaydı.</p>
            </div>
          ) : (
            <EmptyState title="Henüz atölye kaydı yok">Öğretmenin veya admin seni bir atölyeye kaydettiğinde burada görünür.</EmptyState>
          )}
        </Card>
        <Card>
          <CardTitle>Aktif Rozetler</CardTitle>
          {rewards.length ? (
            <div className="flex flex-wrap gap-2">
              {rewards.slice(0, 6).map((studentReward) => (
                <Badge key={studentReward.id} tone={studentReward.status === "active" ? "green" : "amber"}>
                  {studentReward.reward.name}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState title="Rozet yok">Elmas kazanıp mağazadan ödül alabilirsin.</EmptyState>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>Son Duyurular</CardTitle>
        {announcements.length ? (
          <div className="grid gap-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-bold text-ink">{announcement.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{announcement.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Duyuru yok" />
        )}
      </Card>
    </StudentLayout>
  );
}
