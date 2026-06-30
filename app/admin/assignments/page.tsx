import { ConfirmButton } from "@/components/confirm-button";
import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { adminCreateAssignmentAction, adminDeleteAssignmentAction, adminUpdateAssignmentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </option>
              ))}
            </Select>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Hafta" name="weekNumber" type="number" min="1" max="8" defaultValue="1" />
              <Input label="Son teslim" name="dueDate" type="date" />
              <Input label="Elmas" name="diamondReward" type="number" defaultValue="20" />
            </div>
            <Input label="Maks. puan" name="maxScore" type="number" defaultValue="100" />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" name="requiresFile" />
              Dosya yükleme gerekli
            </label>
            <Button>Oluştur</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Ödevler</CardTitle>
          {assignments.length ? (
            <Table headers={["Ödev", "Atölye", "Durum", "Son Teslim", "Teslim", "İşlem"]}>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="align-top">
                  <td className="px-3 py-3 font-semibold text-ink">
                    {assignment.title}
                    <br />
                    <span className="text-xs font-normal text-slate-400">
                      {assignment.teacher ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}` : "Admin"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="blue">{assignment.workshop.name}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={assignment.isActive ? "green" : "amber"}>{assignment.isActive ? "Aktif" : "Pasif"}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(assignment.dueDate)}</td>
                  <td className="px-3 py-3 text-slate-600">{assignment._count.submissions}</td>
                  <td className="px-3 py-3">
                    <div className="grid min-w-80 gap-2">
                      <form action={adminUpdateAssignmentAction} className="grid gap-2">
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <Input label="Başlık" name="title" defaultValue={assignment.title} required />
                        <Textarea label="Açıklama" name="description" defaultValue={assignment.description} required />
                        <Select label="Atölye" name="workshopId" defaultValue={assignment.workshopId}>
                          {workshops.map((workshop) => (
                            <option key={workshop.id} value={workshop.id}>
                              {workshop.name}
                            </option>
                          ))}
                        </Select>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input label="Hafta" name="weekNumber" type="number" min="1" defaultValue={assignment.weekNumber} />
                          <Input label="Son teslim" name="dueDate" type="date" defaultValue={dateInputValue(assignment.dueDate)} />
                          <Input label="Elmas" name="diamondReward" type="number" defaultValue={assignment.diamondReward} />
                          <Input label="Maks. puan" name="maxScore" type="number" defaultValue={assignment.maxScore} />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <input type="checkbox" name="requiresFile" defaultChecked={assignment.requiresFile} />
                          Dosya yükleme gerekli
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <input type="checkbox" name="isActive" defaultChecked={assignment.isActive} />
                          Aktif
                        </label>
                        <Button variant="secondary">Güncelle</Button>
                      </form>
                      <form action={adminDeleteAssignmentAction}>
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <ConfirmButton
                          variant="danger"
                          className="flex w-full"
                          message={`${assignment.title} ödevini ve teslimlerini silmek istediğinize emin misiniz?`}
                        >
                          Ödevi Sil
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
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
