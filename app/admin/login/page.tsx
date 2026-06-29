import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full border-slate-300">
          <h1 className="text-2xl font-black text-ink">Admin Girişi</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Admin paneli ana sayfada görünmez, yalnızca bu rota üzerinden erişilir.</p>
          <form action={loginAdminAction} className="grid gap-4">
            <Input label="E-posta" name="email" type="email" required />
            <Input label="Şifre" name="password" type="password" required />
            <Button>Admin Paneline Gir</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
