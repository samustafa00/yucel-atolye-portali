import Link from "next/link";
import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { loginStudentAction } from "@/lib/actions";

export default function StudentLoginPage() {
  return (
    <PublicLayout>
      <AuthShell title="Öğrenci Girişi" description="Okul numaran ve şifrenle giriş yap.">
        <form action={loginStudentAction} className="grid gap-4">
          <Input label="Okul numarası" name="schoolNumber" autoComplete="username" required />
          <Input label="Şifre" name="password" type="password" autoComplete="current-password" required />
          <Button>Giriş Yap</Button>
        </form>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm font-semibold text-slate-600">
          <Link href="/student/register">Yeni kayıt</Link>
          <Link href="/student/forgot-password">Şifremi unuttum</Link>
        </div>
      </AuthShell>
    </PublicLayout>
  );
}

function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <h1 className="text-2xl font-black text-ink">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">{description}</p>
        {children}
      </Card>
    </section>
  );
}
