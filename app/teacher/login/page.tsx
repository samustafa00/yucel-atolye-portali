import Link from "next/link";
import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { loginTeacherAction } from "@/lib/actions";

export default async function TeacherLoginPage({ searchParams }: { searchParams: Promise<{ pending?: string }> }) {
  const params = await searchParams;
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Öğretmen Girişi</h1>
          {params.pending ? <p className="mt-2 rounded-lg bg-amber-100 p-3 text-sm font-semibold text-amber-800">Kaydınız alındı, admin onayı bekleniyor.</p> : null}
          <form action={loginTeacherAction} className="mt-6 grid gap-4">
            <Input label="E-posta" name="email" type="email" required />
            <Input label="Şifre" name="password" type="password" required />
            <Button>Giriş Yap</Button>
          </form>
          <Link href="/teacher/register" className="mt-4 inline-flex text-sm font-semibold text-slate-600">Öğretmen kaydı oluştur</Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
