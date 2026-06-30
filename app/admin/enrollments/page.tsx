import { ConfirmButton } from "@/components/confirm-button";
import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Select, Table } from "@/components/ui";
import { adminCreateEnrollmentAction, adminDeleteEnrollmentAction, adminUpdateEnrollmentAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName, formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

const enrollmentStatusOptions = [
  ["active", "Aktif"],
  ["waitlist", "Bekleme"],
  ["completed", "Tamamlandı"],
  ["cancelled", "İptal"]
] as const;

export default async function AdminEnrollmentsPage() {
  await requireAdmin();
  const [students, workshops, enrollments] = await Promise.all([
    prisma.user.findMany({ where: { role: "student" }, orderBy: { firstName: "asc" } }),
    prisma.workshop.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.enrollment.findMany({ include: { student: true, workshop: true }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Atölye Kayıtları</h1>
      <div className="grid gap-6 lg:grid-cols-[0.65fr_1fr]">
        <Card>
          <CardTitle>Yeni Kayıt</CardTitle>
          <form action={adminCreateEnrollmentAction} className="grid gap-4">
            <Select label="Öğrenci" name="studentId">
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {fullName(student)} - {student.schoolNumber} - {student.gradeLevel && student.branch ? `${student.gradeLevel}/${student.branch}` : "Sınıf yok"}
                </option>
              ))}
            </Select>
            <Select label="Atölye" name="workshopId">
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.name}
                </option>
              ))}
            </Select>
            <Button>Kaydet</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Kayıtlar</CardTitle>
          {enrollments.length ? (
            <Table headers={["Öğrenci", "Atölye", "Durum", "Tarih", "İşlem"]}>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="align-top">
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(enrollment.student)}</td>
                  <td className="px-3 py-3 text-slate-600">{enrollment.workshop.name}</td>
                  <td className="px-3 py-3">
                    <Badge tone={enrollment.status === "active" ? "green" : "amber"}>{enrollment.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(enrollment.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="grid min-w-64 gap-2">
                      <form action={adminUpdateEnrollmentAction} className="grid gap-2">
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <Select label="Atölye" name="workshopId" defaultValue={enrollment.workshopId}>
                          {workshops.map((workshop) => (
                            <option key={workshop.id} value={workshop.id}>
                              {workshop.name}
                            </option>
                          ))}
                        </Select>
                        <Select label="Durum" name="status" defaultValue={enrollment.status}>
                          {enrollmentStatusOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <Button variant="secondary">Güncelle</Button>
                      </form>
                      <form action={adminDeleteEnrollmentAction}>
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <ConfirmButton
                          variant="danger"
                          className="flex w-full"
                          message={`${fullName(enrollment.student)} öğrencisinin ${enrollment.workshop.name} kaydını silmek istediğinize emin misiniz?`}
                        >
                          Kaydı Sil
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Kayıt yok" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
