import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { forgotPasswordAction } from "@/lib/actions";

export default function ForgotPasswordPage() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Şifre Sıfırlama</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">MVP sürümünde doğrulama tokenı doğrudan sıfırlama sayfasına yönlendirir.</p>
          <form action={forgotPasswordAction} className="grid gap-4">
            <Input label="E-posta" name="email" type="email" required />
            <Button>Sıfırlama Tokenı Oluştur</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
