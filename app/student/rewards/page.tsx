import { StudentLayout } from "@/components/layouts";
import { Badge, Button, Card, CardTitle, EmptyState } from "@/components/ui";
import { purchaseRewardAction } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/session";

export default async function StudentRewardsPage() {
  const student = await requireStudent();
  const rewards = await prisma.reward.findMany({ where: { isActive: true }, orderBy: { cost: "asc" } });

  return (
    <StudentLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Ödül Mağazası</h1>
          <p className="text-slate-600">Bakiyen: <strong>{student.diamondBalance} elmas</strong></p>
        </div>
      </div>
      {rewards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id} className="flex flex-col">
              <CardTitle>{reward.name}</CardTitle>
              <p className="min-h-16 text-sm leading-6 text-slate-600">{reward.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="amber">{reward.cost} elmas</Badge>
                <Badge>{reward.type}</Badge>
                {reward.requiresAdminApproval ? <Badge tone="blue">Admin onayı</Badge> : null}
              </div>
              <form action={purchaseRewardAction} className="mt-5">
                <input type="hidden" name="rewardId" value={reward.id} />
                <Button className="flex w-full" disabled={student.diamondBalance < reward.cost}>Satın Al</Button>
              </form>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Mağazada ödül yok" />
      )}
    </StudentLayout>
  );
}
