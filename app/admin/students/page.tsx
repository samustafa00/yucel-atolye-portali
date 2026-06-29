import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Table } from "@/components/ui";
import { adminAdjustDiamondsAction, adminCreateStudentAction, regenerateParentCodeAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminStudentsPage() {
  await requireAdmin();
  const students = await prisma.user.findMany({
    where: { role: "student" },
    include: { parentAccessCodes: true, studentEnrollments: { include: { workshop: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Öğrenci Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Öğrenci Ekle</CardTitle>
          <form action={adminCreateStudentAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ad" name="firstName" required />
              <Input label="Soyad" name="lastName" required />
            </div>
            <Input label="Okul numarası" name="schoolNumber" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Sınıf" name="gradeLevel" placeholder="7" required />
              <Input label="Şube" name="branch" placeholder="A" maxLength={2} required />
            </div>
            <Input label="E-posta" name="email" type="email" required />
            <Input label="Şifre" name="password" placeholder="Boşsa Ogrenci123!" />
            <Button>Öğrenci Oluştur</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Öğrenciler</CardTitle>
          {students.length ? (
            <Table headers={["Öğrenci", "Okul No", "Sınıf/Şube", "Atölye", "Veli Kodu", "Elmas", "İşlem"]}>
              {students.map((student) => (
                <tr key={student.id} className="align-top">
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(student)}<br /><span className="text-xs text-slate-400">{student.email}</span></td>
                  <td className="px-3 py-3 text-slate-600">{student.schoolNumber}</td>
                  <td className="px-3 py-3 text-slate-600">{student.gradeLevel && student.branch ? `${student.gradeLevel}/${student.branch}` : "-"}</td>
                  <td className="px-3 py-3">
                    {student.studentEnrollments.map((enrollment) => (
                      <Badge key={enrollment.id} tone={enrollment.status === "active" ? "green" : "amber"}>{enrollment.workshop.name}</Badge>
                    ))}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-slate-700">{student.parentAccessCodes[0]?.code ?? "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{student.diamondBalance}</td>
                  <td className="px-3 py-3">
                    <div className="grid min-w-56 gap-2">
                      <form action={regenerateParentCodeAction}>
                        <input type="hidden" name="studentId" value={student.id} />
                        <Button variant="secondary" className="flex w-full">Veli Kodunu Yenile</Button>
                      </form>
                      <form action={adminAdjustDiamondsAction} className="grid gap-2">
                        <input type="hidden" name="studentId" value={student.id} />
                        <Input label="Elmas düzeltme" name="amount" type="number" defaultValue="10" />
                        <Input label="Neden" name="reason" defaultValue="Admin düzeltmesi" />
                        <Button>Uygula</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Öğrenci yok" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
