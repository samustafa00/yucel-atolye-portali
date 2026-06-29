import { StudentLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, EmptyState, Table } from "@/components/ui";
import { rewardStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function StudentBadgesPage() {
  const student = await requireStudent();
  const rewards = await prisma.studentReward.findMany({
    where: { studentId: student.id },
    include: { reward: true },
    orderBy: { purchasedAt: "desc" }
  });

  return (
    <StudentLayout>
      <h1 className="mb-6 text-3xl font-black text-ink">Rozetlerim ve Madalyalarım</h1>
      <Card>
        <CardTitle>Kazanılan Ödüller</CardTitle>
        {rewards.length ? (
          <Table headers={["Ödül", "Tür", "Durum", "Alınma", "Bitiş"]}>
            {rewards.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 font-semibold text-ink">{item.reward.name}</td>
                <td className="px-3 py-3 text-slate-600">{item.reward.type}</td>
                <td className="px-3 py-3"><Badge tone={item.status === "active" ? "green" : "amber"}>{rewardStatusLabels[item.status]}</Badge></td>
                <td className="px-3 py-3 text-slate-600">{formatDate(item.purchasedAt)}</td>
                <td className="px-3 py-3 text-slate-600">{formatDate(item.expiresAt)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Henüz ödül yok" />
        )}
      </Card>
    </StudentLayout>
  );
}
