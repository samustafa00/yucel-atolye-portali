import { StudentLayout } from "@/components/layouts";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentAnnouncementsPage() {
  const student = await requireStudent();
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: student.id, status: "active" } });
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      OR: [
        { targetType: "all" },
        { targetType: "students" },
        enrollment ? { targetType: "workshop", workshopId: enrollment.workshopId } : { id: "__none" }
      ]
    },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <StudentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Duyurular</h1>
      <Card>
        <CardTitle>Güncel Duyurular</CardTitle>
        {announcements.length ? (
          <div className="grid gap-3">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-lg border border-slate-200 p-4">
                <h2 className="font-bold text-ink">{announcement.title}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">{formatDateTime(announcement.publishedAt)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Duyuru yok" />
        )}
      </Card>
    </StudentLayout>
  );
}
