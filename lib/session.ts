import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "atolye_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export type UserSession = {
  kind: "user";
  userId: string;
  role: Role;
};

export type ParentSession = {
  kind: "parent";
  studentId: string;
};

export type AppSession = UserSession | ParentSession;

function secret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeSession(session: AppSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value?: string): AppSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function createUserSession(userId: string, role: Role) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + ONE_YEAR * 1000);
  cookieStore.set(SESSION_COOKIE, encodeSession({ kind: "user", userId, role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    expires,
    path: "/"
  });
}

export async function createParentSession(studentId: string) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + ONE_YEAR * 1000);
  cookieStore.set(SESSION_COOKIE, encodeSession({ kind: "parent", studentId }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    expires,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session || session.kind !== "user" || session.role !== role) {
    redirect(`/${role}/login`);
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== role || !user.isActive || !user.isApproved) {
    redirect(`/${role}/login`);
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireTeacher() {
  return requireRole("teacher");
}

export async function requireStudent() {
  return requireRole("student");
}

export async function requireParentStudent() {
  const session = await getSession();
  if (!session || session.kind !== "parent") {
    redirect("/parent/login");
  }
  const student = await prisma.user.findUnique({ where: { id: session.studentId } });
  if (!student || student.role !== "student" || !student.isActive) {
    redirect("/parent/login");
  }
  return student;
}
