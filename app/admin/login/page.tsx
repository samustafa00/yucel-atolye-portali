import { AdminLoginForm } from "@/components/login-forms";
import { PublicLayout } from "@/components/layouts";
import { Card } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
        <Card className="w-full border-slate-300">
          <h1 className="text-2xl font-black text-ink">Admin Girişi</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Admin paneli ana sayfada görünmez, yalnızca bu rota üzerinden erişilir.</p>
          <AdminLoginForm />
        </Card>
      </section>
    </PublicLayout>
  );
}
