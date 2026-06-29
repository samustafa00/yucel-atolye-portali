import { notFound } from "next/navigation";
import { BookOpen, Gem, GraduationCap, Users } from "lucide-react";
import { PublicLayout } from "@/components/layouts";
import { Badge, Card, CardTitle, ProgressBar, StatCard } from "@/components/ui";
import { SCHOOL_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { lines } from "@/lib/format";

export default async function WorkshopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await prisma.workshop.findUnique({
    where: { slug },
    include: {
      curriculum: { orderBy: { weekNumber: "asc" } },
      permissions: { include: { teacher: true } },
      _count: { select: { enrollments: { where: { status: "active" } } } }
    }
  });

  if (!workshop || !workshop.isActive) notFound();
  const occupancy = Math.round((workshop._count.enrollments / Math.max(workshop.capacity, 1)) * 100);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge tone="blue">{SCHOOL_NAME}</Badge>
            <h1 className="mt-4 text-4xl font-black text-ink">{workshop.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{workshop.shortDescription}</p>
          </div>
          <Card>
            <CardTitle>Kontenjan</CardTitle>
            <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
              <span>{workshop._count.enrollments} kayıt</span>
              <span>{workshop.capacity} kontenjan</span>
            </div>
            <ProgressBar value={occupancy} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard label="Hafta" value="8" icon={<BookOpen className="h-5 w-5" />} tone="bg-sky-100" />
              <StatCard label="Kazanım" value={lines(workshop.outcomes).length} icon={<Gem className="h-5 w-5" />} tone="bg-amber-100" />
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Kimler İçin Uygun?</CardTitle>
            <ul className="grid gap-2 text-sm leading-6 text-slate-600">
              {lines(workshop.suitableFor).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </Card>
          <Card>
            <CardTitle>Öğrenciler Ne Öğrenecek?</CardTitle>
            <ul className="grid gap-2 text-sm leading-6 text-slate-600">
              {lines(workshop.outcomes).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </Card>
        </div>

        <Card className="mt-6">
          <CardTitle>8 Haftalık Müfredat</CardTitle>
          <div className="grid gap-3">
            {workshop.curriculum.map((week) => (
              <div key={week.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="green">{week.weekNumber}. Hafta</Badge>
                  <h3 className="font-bold text-ink">{week.title}</h3>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{week.description}</p>
                <p className="mt-2 text-sm text-slate-600"><strong>Etkinlik:</strong> {week.activity}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Örnek Proje Çıktısı</CardTitle>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{workshop.description}</p>
          </Card>
          <Card>
            <CardTitle>Atölye Sorumluları</CardTitle>
            {workshop.permissions.length ? (
              <div className="grid gap-2">
                {workshop.permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <GraduationCap className="h-5 w-5 text-leaf" />
                    <span className="font-semibold text-ink">{permission.teacher.firstName} {permission.teacher.lastName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                Sorumlu öğretmen admin tarafından atanacak.
              </div>
            )}
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
