"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { loginAdminAction, loginParentAction, loginStudentAction, loginTeacherAction } from "@/lib/actions";

const initialState = { error: "" };

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
}

export function StudentLoginForm() {
  const [state, formAction, pending] = useActionState(loginStudentAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <ErrorMessage message={state.error} />
      <Input label="Okul numarası" name="schoolNumber" autoComplete="username" required />
      <Input label="Şifre" name="password" type="password" autoComplete="current-password" required />
      <Button disabled={pending}>{pending ? "Kontrol ediliyor..." : "Giriş Yap"}</Button>
    </form>
  );
}

export function TeacherLoginForm() {
  const [state, formAction, pending] = useActionState(loginTeacherAction, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <ErrorMessage message={state.error} />
      <Input label="E-posta" name="email" type="email" autoComplete="email" required />
      <Input label="Şifre" name="password" type="password" autoComplete="current-password" required />
      <Button disabled={pending}>{pending ? "Kontrol ediliyor..." : "Giriş Yap"}</Button>
    </form>
  );
}

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <ErrorMessage message={state.error} />
      <Input label="E-posta" name="email" type="email" autoComplete="email" required />
      <Input label="Şifre" name="password" type="password" autoComplete="current-password" required />
      <Button disabled={pending}>{pending ? "Kontrol ediliyor..." : "Admin Paneline Gir"}</Button>
    </form>
  );
}

export function ParentLoginForm() {
  const [state, formAction, pending] = useActionState(loginParentAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <ErrorMessage message={state.error} />
      <Input label="Öğrenci okul numarası" name="schoolNumber" autoComplete="username" required />
      <Input label="Veli erişim kodu" name="parentCode" placeholder="V-8K4P2X" required />
      <Button disabled={pending}>{pending ? "Kontrol ediliyor..." : "Görüntüle"}</Button>
    </form>
  );
}
