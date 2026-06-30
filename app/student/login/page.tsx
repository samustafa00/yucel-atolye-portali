import Link from "next/link";
import { StudentLoginForm } from "@/components/login-forms";
import { PublicLayout } from "@/components/layouts";
import { Card } from "@/components/ui";

export default function StudentLoginPage() {
  return (
    <PublicLayout>
      <AuthShell title="Öğrenci Girişi" description="Okul numaran ve şifrenle giriş yap.">
        <StudentLoginForm />
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
