import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { resetPasswordAction } from "@/lib/actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Yeni Şifre</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Token sürelidir ve kullanıldıktan sonra geçersiz olur.</p>
          <form action={resetPasswordAction} className="grid gap-4">
            <Input label="Token" name="token" defaultValue={params.token ?? ""} required />
            <Input label="Yeni şifre" name="password" type="password" required />
            <Input label="Yeni şifre tekrar" name="passwordConfirm" type="password" required />
            <Button>Şifreyi Güncelle</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
