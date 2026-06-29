import { GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/layouts";
import { Card, LinkButton, StatCard } from "@/components/ui";
import { WorkshopCard } from "@/components/workshop-card";
import { PORTAL_NAME, SCHOOL_NAME } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const workshops = await prisma.workshop.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { enrollments: { where: { status: "active" } } } } }
  });

  return (
    <PublicLayout>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber" />
            {PORTAL_NAME}
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
            {SCHOOL_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            {PORTAL_NAME} ile öğrenciler ödevlerini ve elmaslarını takip eder, öğretmenler atölyeleri yönetir,
            veliler çocuklarının ilerlemesini güvenli veli koduyla görüntüler.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/student/login">Öğrenci Portalı</LinkButton>
            <LinkButton href="/teacher/login" variant="secondary">Öğretmen Portalı</LinkButton>
            <LinkButton href="/parent/login" variant="secondary">Veli Portalı</LinkButton>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Atölye" value={workshops.length} icon={<GraduationCap className="h-5 w-5" />} tone="bg-sky-100" />
          <StatCard label="Müfredat" value="8 hafta" icon={<ShieldCheck className="h-5 w-5" />} tone="bg-emerald-100" />
        </div>
      </section>

      <section className="bg-white/65 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-leaf">Atölyeler</p>
              <h2 className="text-2xl font-black text-ink">Öğrenme rotaları</h2>
            </div>
            <LinkButton href="/workshops" variant="ghost">Tümünü Gör</LinkButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} enrolled={workshop._count.enrollments} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          ["Öğrenciler", "Ödev, rozet, elmas geçmişi ve atölye ilerlemesi tek panelde."],
          ["Öğretmenler", "Yetkili olunan atölyede öğrenci kaydı, ödev, yoklama ve duyuru."],
          ["Veliler", "Öğrenci şifresi olmadan, sadece veli koduyla güvenli görüntüleme."]
        ].map(([title, description]) => (
          <Card key={title}>
            <h3 className="text-lg font-black text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Card>
        ))}
      </section>
    </PublicLayout>
  );
}
