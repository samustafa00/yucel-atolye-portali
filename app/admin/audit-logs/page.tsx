import { AdminLayout } from "@/components/layouts";
import { Card, CardTitle, Table } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Sistem Kayıtları</h1>
      <Card>
        <CardTitle>Audit Log</CardTitle>
        <Table headers={["Tarih", "Kullanıcı", "İşlem", "Varlık", "Açıklama"]}>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-3 py-3 text-slate-600">{formatDateTime(log.createdAt)}</td>
              <td className="px-3 py-3 text-slate-600">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem"}</td>
              <td className="px-3 py-3 font-semibold text-ink">{log.action}</td>
              <td className="px-3 py-3 text-slate-600">{log.entityType}</td>
              <td className="px-3 py-3 text-slate-600">{log.description}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </AdminLayout>
  );
}
