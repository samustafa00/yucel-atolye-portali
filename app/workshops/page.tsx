import { PublicLayout } from "@/components/layouts";
import { WorkshopCard } from "@/components/workshop-card";
import { SCHOOL_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { enrollments: { where: { status: "active" } } } } }
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-wide text-leaf">{SCHOOL_NAME}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">6 farklı öğrenme alanı</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Her atölye ortaokul düzeyine uygun, güvenli ve 8 haftalık müfredatla tasarlandı.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} enrolled={workshop._count.enrollments} />
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
