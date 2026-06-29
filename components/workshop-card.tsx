import Link from "next/link";
import { ArrowRight, BookOpen, Cpu, Plane, Rocket } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";

export function WorkshopCard({
  workshop,
  enrolled = 0
}: {
  workshop: {
    name: string;
    slug: string;
    shortDescription: string;
    capacity: number;
    sortOrder: number;
  };
  enrolled?: number;
}) {
  const colors = ["bg-sky-100", "bg-emerald-100", "bg-amber-100", "bg-rose-100", "bg-indigo-100", "bg-lime-100"];
  const Icon = workshop.name.includes("Yapay Zeka")
    ? Cpu
    : workshop.name.includes("Sabit Kanat") || workshop.name.includes("Döner Kanat") || workshop.name.includes("FPV")
      ? Plane
      : Rocket;

  return (
    <Link href={`/workshops/${workshop.slug}`}>
      <Card className="group h-full p-0 transition hover:-translate-y-1 hover:shadow-soft">
        <div className={`${colors[workshop.sortOrder % colors.length]} flex min-h-28 items-center justify-between rounded-t-lg p-5`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/80 text-ink">
            <Icon className="h-7 w-7" />
          </div>
          <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1" />
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <h3 className="text-lg font-black text-ink">{workshop.name}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{workshop.shortDescription}</p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 8 hafta</span>
              <span>{enrolled}/{workshop.capacity} kontenjan</span>
            </div>
            <ProgressBar value={Math.round((enrolled / Math.max(workshop.capacity, 1)) * 100)} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
