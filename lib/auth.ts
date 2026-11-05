import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/mysql";
import type { RowDataPacket } from "mysql2/promise";
import { logActivity } from "@/lib/mongodb";

export type SessionUser = { userId: number; fullName: string; email: string; role: "user" | "admin" };
const cookieName = "auction_session";
function secret() { const value = process.env.AUTH_SECRET; if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters."); return new TextEncoder().encode(value); }
export async function createSession(user: SessionUser) { const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret()); cookies().set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 }); }
export function clearSession() { cookies().delete(cookieName); }
export async function currentUser(): Promise<SessionUser | null> {
  const token = cookies().get(cookieName)?.value; if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret()); return { userId: Number(payload.userId), fullName: String(payload.fullName), email: String(payload.email), role: payload.role === "admin" ? "admin" : "user" }; } catch { return null; }
}
export async function requireUser() { const user = await currentUser(); if (!user) throw new AuthError(401, "Please sign in to continue."); return user; }
export async function requireAdmin() { const user = await requireUser(); if (user.role !== "admin") throw new AuthError(403, "Administrator access is required."); return user; }
export class AuthError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function auditLogin(userId: number, action: string) { await logActivity(userId, action, "user", userId, action === "LOGIN" ? "Successful sign in" : "Sign out"); }
export async function findAccount(email: string) { const rows = await query<(RowDataPacket & { user_id: number; full_name: string; email: string; password_hash: string; role: string })[]>("SELECT user_id, full_name, email, password_hash, role FROM user_account WHERE email = ? LIMIT 1", [email]); return rows[0] ?? null; }
