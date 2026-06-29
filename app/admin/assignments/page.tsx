import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { adminCreateAssignmentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminAssignmentsPage() {
  await requireAdmin();
  const [workshops, assignments] = await Promise.all([
    prisma.workshop.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.assignment.findMany({
      include: { workshop: true, teacher: true, _count: { select: { submissions: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Ödev Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Ödev Oluştur</CardTitle>
          <form action={adminCreateAssignmentAction} className="grid gap-4">
            <Input label="Başlık" name="title" required />
            <Textarea label="Açıklama" name="description" required />
            <Select label="Atölye" name="workshopId">
              {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Hafta" name="weekNumber" type="number" min="1" max="8" defaultValue="1" />
              <Input label="Son teslim" name="dueDate" type="date" />
              <Input label="Elmas" name="diamondReward" type="number" defaultValue="20" />
            </div>
            <Input label="Maks. puan" name="maxScore" type="number" defaultValue="100" />
            <Button>Oluştur</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Ödevler</CardTitle>
          {assignments.length ? (
            <Table headers={["Başlık", "Atölye", "Öğretmen", "Son Teslim", "Teslim"]}>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{assignment.title}</td>
                  <td className="px-3 py-3"><Badge tone="blue">{assignment.workshop.name}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{assignment.teacher ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}` : "Admin"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(assignment.dueDate)}</td>
                  <td className="px-3 py-3 text-slate-600">{assignment._count.submissions}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Ödev yok" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
