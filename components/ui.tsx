import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(buttonClass(variant), "focus-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <Link href={href} className={clsx(buttonClass(variant), "focus-ring inline-flex", className)}>
      {children}
    </Link>
  );
}

export function buttonClass(variant: "primary" | "secondary" | "ghost" | "danger" = "primary") {
  return clsx(
    "min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
    {
      "bg-ink text-white hover:bg-slate-700": variant === "primary",
      "border border-slate-200 bg-white text-ink hover:bg-slate-50": variant === "secondary",
      "text-slate-700 hover:bg-slate-100": variant === "ghost",
      "bg-coral text-white hover:bg-red-500": variant === "danger"
    }
  );
}

export function Card({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)}
      {...props}
    />
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Input({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className={clsx(
          "focus-ring min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-ink shadow-sm",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: ComponentProps<"textarea"> & { label?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className={clsx(
          "focus-ring min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-ink shadow-sm",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { label?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select
        className={clsx(
          "focus-ring min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-ink shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = "slate"
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
}) {
  return (
    <span
      className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", {
        "bg-slate-100 text-slate-700": tone === "slate",
        "bg-emerald-100 text-emerald-700": tone === "green",
        "bg-amber-100 text-amber-700": tone === "amber",
        "bg-red-100 text-red-700": tone === "red",
        "bg-sky-100 text-sky-700": tone === "blue"
      })}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "bg-skyglass"
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={clsx("flex h-11 w-11 items-center justify-center rounded-lg", tone)}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function Table({
  headers,
  children
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <h3 className="font-semibold text-ink">{title}</h3>
      {children ? <p className="mt-2 text-sm text-slate-500">{children}</p> : null}
    </div>
  );
}
