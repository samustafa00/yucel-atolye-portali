import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateParentCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `V-${code}`;
}

export function generateResetToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
