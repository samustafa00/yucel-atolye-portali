import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { adminNav, parentNav, publicNav, studentNav, teacherNav } from "@/lib/constants";
import { PORTAL_NAME, SCHOOL_LOGO_PATH, SCHOOL_NAME } from "@/lib/constants";
import { logoutAction } from "@/lib/actions";
import { buttonClass } from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-black text-ink">
            <img
              src={SCHOOL_LOGO_PATH}
              alt={`${SCHOOL_NAME} logosu`}
              className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm leading-4 sm:text-base">{SCHOOL_NAME}</span>
              <span className="block text-xs font-bold text-slate-500">{PORTAL_NAME}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <details className="md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Menu className="h-5 w-5" />
            </summary>
            <nav className="absolute left-4 right-4 top-16 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
              {publicNav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Öğrenci Portalı" nav={studentNav}>{children}</PortalShell>;
}

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Öğretmen Portalı" nav={teacherNav}>{children}</PortalShell>;
}

export function ParentLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Veli Portalı" nav={parentNav}>{children}</PortalShell>;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Admin Paneli" nav={adminNav}>{children}</PortalShell>;
}

function PortalShell({
  title,
  nav,
  children
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-4">
            <Link href="/" className="mb-6 flex items-center gap-2 font-black text-ink">
              <img
                src={SCHOOL_LOGO_PATH}
                alt={`${SCHOOL_NAME} logosu`}
                className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
              />
              <span>
                <span className="block text-sm leading-4">{SCHOOL_NAME}</span>
                <span className="block text-xs font-bold text-slate-500">{title}</span>
              </span>
            </Link>
            <nav className="grid gap-1">
              {nav.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
            <form action={logoutAction} className="mt-auto">
              <button className={`${buttonClass("secondary")} flex w-full`}>
                <LogOut className="h-4 w-4" />
                Çıkış
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="font-black text-ink">{title}</Link>
              <form action={logoutAction}>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
            <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </section>
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {item.label}
    </Link>
  );
}
