import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { registerTeacherAction } from "@/lib/actions";

export default function TeacherRegisterPage() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Öğretmen Kaydı</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Hesap admin onayından sonra aktif olur.</p>
          <form action={registerTeacherAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ad" name="firstName" required />
              <Input label="Soyad" name="lastName" required />
            </div>
            <Input label="E-posta" name="email" type="email" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Şifre" name="password" type="password" required />
              <Input label="Şifre tekrar" name="passwordConfirm" type="password" required />
            </div>
            <Button>Kayıt Ol</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
