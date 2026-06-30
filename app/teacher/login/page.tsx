import Link from "next/link";
import { TeacherLoginForm } from "@/components/login-forms";
import { PublicLayout } from "@/components/layouts";
import { Card } from "@/components/ui";

export default async function TeacherLoginPage({ searchParams }: { searchParams: Promise<{ pending?: string }> }) {
  const params = await searchParams;
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Öğretmen Girişi</h1>
          {params.pending ? <p className="mt-2 rounded-lg bg-amber-100 p-3 text-sm font-semibold text-amber-800">Kaydınız alındı, admin onayı bekleniyor.</p> : null}
          <TeacherLoginForm />
          <Link href="/teacher/register" className="mt-4 inline-flex text-sm font-semibold text-slate-600">Öğretmen kaydı oluştur</Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
