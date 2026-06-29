import { TeacherLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { addTeacherNoteAction, giveDiamondsAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/format";
import { teacherWorkshopIds } from "@/lib/permissions";
import { requireTeacher } from "@/lib/session";

export default async function TeacherStudentsPage() {
  const teacher = await requireTeacher();
  const workshopIds = await teacherWorkshopIds(teacher.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { workshopId: { in: workshopIds }, status: "active" },
    include: {
      student: {
        include: {
          studentSubmissions: true
        }
      },
      workshop: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <TeacherLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Öğrenci Listesi</h1>
      <Card>
        <CardTitle>Yetkili Atölyelerdeki Öğrenciler</CardTitle>
        {enrollments.length ? (
          <Table headers={["Öğrenci", "Okul No", "Sınıf/Şube", "Atölye", "Elmas", "Tamamlanan", "İşlem"]}>
            {enrollments.map((enrollment) => {
              const completed = enrollment.student.studentSubmissions.filter((submission) => submission.status === "graded").length;
              return (
                <tr key={enrollment.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(enrollment.student)}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.student.schoolNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.student.gradeLevel && enrollment.student.branch ? `${enrollment.student.gradeLevel}/${enrollment.student.branch}` : "-"}</td>
                  <td className="px-3 py-3"><Badge tone="blue">{enrollment.workshop.name}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.student.diamondBalance}</td>
                  <td className="px-3 py-3 text-slate-600">{completed}</td>
                  <td className="px-3 py-3">
                    <details className="min-w-64">
                      <summary className="cursor-pointer font-semibold text-leaf">Hızlı işlem</summary>
                      <div className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3">
                        <form action={giveDiamondsAction} className="grid gap-2">
                          <input type="hidden" name="studentId" value={enrollment.studentId} />
                          <input type="hidden" name="workshopId" value={enrollment.workshopId} />
                          <Input label="Elmas" name="amount" type="number" min="1" defaultValue="20" />
                          <Input label="Açıklama" name="reason" defaultValue="Haftalık görev katkısı" />
                          <Button>Elmas Ver</Button>
                        </form>
                        <form action={addTeacherNoteAction} className="grid gap-2">
                          <input type="hidden" name="studentId" value={enrollment.studentId} />
                          <input type="hidden" name="workshopId" value={enrollment.workshopId} />
                          <Textarea label="Veli notu" name="note" />
                          <Button variant="secondary">Not Ekle</Button>
                        </form>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState title="Öğrenci yok">Yetkili olduğunuz atölyeye öğrenci kaydedince burada görünür.</EmptyState>
        )}
      </Card>
    </TeacherLayout>
  );
}
