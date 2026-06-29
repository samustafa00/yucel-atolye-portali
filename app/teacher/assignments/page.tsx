import Link from "next/link";
import { TeacherLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, LinkButton, Table } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherAssignmentsPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const assignments = await prisma.assignment.findMany({
    where: { workshopId: { in: workshopIds } },
    include: { workshop: true, _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <TeacherLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-ink">Ödevler</h1>
        <LinkButton href="/teacher/assignments/new">Yeni Ödev</LinkButton>
      </div>
      <Card>
        <CardTitle>Atölye Ödevleri</CardTitle>
        {assignments.length ? (
          <Table headers={["Başlık", "Atölye", "Hafta", "Son Teslim", "Elmas", "Teslim"]}>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-3 py-3 font-semibold text-ink"><Link href="/teacher/submissions">{assignment.title}</Link></td>
                <td className="px-3 py-3"><Badge tone="blue">{assignment.workshop.name}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{assignment.weekNumber}</td>
                <td className="px-3 py-3 text-slate-600">{formatDate(assignment.dueDate)}</td>
                <td className="px-3 py-3 text-slate-600">{assignment.diamondReward}</td>
                <td className="px-3 py-3 text-slate-600">{assignment._count.submissions}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Ödev yok" />
        )}
      </Card>
    </TeacherLayout>
  );
}
