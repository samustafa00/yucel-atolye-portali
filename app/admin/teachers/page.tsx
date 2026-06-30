import { AdminLayout } from "@/components/layouts";
import { ConfirmButton } from "@/components/confirm-button";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table } from "@/components/ui";
import { adminCreateTeacherAction, adminDeleteTeacherAction, adminSetPermissionAction, approveTeacherAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminTeachersPage() {
  await requireAdmin();
  const [teachers, workshops] = await Promise.all([
    prisma.user.findMany({
      where: { role: "teacher" },
      include: { teacherPermissions: { include: { workshop: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.workshop.findMany({ orderBy: { sortOrder: "asc" } })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Öğretmen Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Öğretmen Ekle</CardTitle>
          <form action={adminCreateTeacherAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ad" name="firstName" required />
              <Input label="Soyad" name="lastName" required />
            </div>
            <Input label="E-posta" name="email" type="email" required />
            <Input label="Şifre" name="password" placeholder="Boşsa Ogretmen123!" />
            <Button>Öğretmen Oluştur</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Öğretmenler ve Yetkiler</CardTitle>
          {teachers.length ? (
            <Table headers={["Öğretmen", "Durum", "Yetkiler", "İşlem"]}>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="align-top">
                  <td className="px-3 py-3 font-semibold text-ink">{fullName(teacher)}<br /><span className="text-xs text-slate-400">{teacher.email}</span></td>
                  <td className="px-3 py-3"><Badge tone={teacher.isApproved ? "green" : "amber"}>{teacher.isApproved ? "Onaylı" : "Bekliyor"}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {teacher.teacherPermissions.map((permission) => (
                        <form key={permission.id} action={adminSetPermissionAction} className="inline-flex">
                          <input type="hidden" name="teacherId" value={teacher.id} />
                          <input type="hidden" name="workshopId" value={permission.workshopId} />
                          <input type="hidden" name="intent" value="remove" />
                          <button className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{permission.workshop.name} ×</button>
                        </form>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="grid min-w-72 gap-3">
                      <form action={approveTeacherAction} className="grid gap-2">
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <input type="hidden" name="isApproved" value={teacher.isApproved ? "false" : "true"} />
                        <Button variant="secondary">{teacher.isApproved ? "Onayı Kaldır" : "Onayla"}</Button>
                      </form>
                      <form action={adminSetPermissionAction} className="grid gap-2 rounded-lg bg-slate-50 p-3">
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <Select label="Atölye" name="workshopId">
                          {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}
                        </Select>
                        {["canManageStudents", "canCreateAssignments", "canGradeAssignments", "canTakeAttendance", "canCreateAnnouncements"].map((key) => (
                          <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <input type="checkbox" name={key} defaultChecked />
                            {key}
                          </label>
                        ))}
                        <Button>Yetki Ver/Güncelle</Button>
                      </form>
                      <form action={adminDeleteTeacherAction}>
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <ConfirmButton
                          variant="danger"
                          className="flex w-full"
                          message={`${fullName(teacher)} öğretmenini silmek istediğinize emin misiniz?`}
                        >
                          Öğretmeni Sil
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Öğretmen yok" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
