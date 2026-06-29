import { AdminLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState, Input, Select, Table, Textarea } from "@/components/ui";
import { adminCreateRewardAction, adminModerateRewardAction } from "@/lib/actions";
import { rewardStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { fullName } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminRewardsPage() {
  await requireAdmin();
  const [rewards, pending] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    prisma.studentReward.findMany({
      where: { status: "pending" },
      include: { reward: true, student: true },
      orderBy: { purchasedAt: "desc" }
    })
  ]);

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Oyunlaştırma ve Ödül Yönetimi</h1>
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <CardTitle>Ödül Ekle</CardTitle>
          <form action={adminCreateRewardAction} className="grid gap-4">
            <Input label="Ödül adı" name="name" required />
            <Textarea label="Açıklama" name="description" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Gerekli elmas" name="cost" type="number" defaultValue="100" />
              <Select label="Tür" name="type">
                <option value="badge">Rozet</option>
                <option value="medal">Madalya</option>
                <option value="frame">Profil çerçevesi</option>
                <option value="social_good">Sosyal sorumluluk</option>
              </Select>
            </div>
            <Input label="Süre gün" name="durationDays" type="number" placeholder="Süresiz için boş" />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" name="requiresAdminApproval" />
              Admin onayı gerekli
            </label>
            <Button>Ödül Oluştur</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardTitle>Bekleyen Onaylar</CardTitle>
            {pending.length ? (
              <Table headers={["Öğrenci", "Ödül", "Durum", "İşlem"]}>
                {pending.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-semibold text-ink">{fullName(item.student)}</td>
                    <td className="px-3 py-3 text-slate-600">{item.reward.name}</td>
                    <td className="px-3 py-3"><Badge tone="amber">{rewardStatusLabels[item.status]}</Badge></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <form action={adminModerateRewardAction}>
                          <input type="hidden" name="studentRewardId" value={item.id} />
                          <input type="hidden" name="intent" value="approve" />
                          <Button>Onayla</Button>
                        </form>
                        <form action={adminModerateRewardAction}>
                          <input type="hidden" name="studentRewardId" value={item.id} />
                          <input type="hidden" name="intent" value="reject" />
                          <Button variant="danger">Reddet</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState title="Bekleyen ödül yok" />
            )}
          </Card>
          <Card>
            <CardTitle>Ödül Mağazası</CardTitle>
            <Table headers={["Ödül", "Tür", "Elmas", "Onay"]}>
              {rewards.map((reward) => (
                <tr key={reward.id}>
                  <td className="px-3 py-3 font-semibold text-ink">{reward.name}</td>
                  <td className="px-3 py-3 text-slate-600">{reward.type}</td>
                  <td className="px-3 py-3 text-slate-600">{reward.cost}</td>
                  <td className="px-3 py-3">{reward.requiresAdminApproval ? <Badge tone="blue">Gerekli</Badge> : <Badge tone="green">Anında</Badge>}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
