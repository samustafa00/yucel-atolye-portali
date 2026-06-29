import { PublicLayout } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import { loginParentAction } from "@/lib/actions";

export default function ParentLoginPage() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-2xl font-black text-ink">Veli Girişi</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Öğrenci şifresi gerekmez. Okul numarası ve veli kodu yeterlidir.</p>
          <form action={loginParentAction} className="grid gap-4">
            <Input label="Öğrenci okul numarası" name="schoolNumber" required />
            <Input label="Veli erişim kodu" name="parentCode" placeholder="V-8K4P2X" required />
            <Button>Görüntüle</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}
