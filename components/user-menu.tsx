"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type User = { fullName: string; role: string };
export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setUser(d?.user ?? null)).catch(() => {}); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); location.href = "/"; }
  return user ? <><Link href="/my-bids">My bids</Link><Link href="/my-transactions">Transactions</Link>{user.role === "admin" && <Link href="/admin">Admin</Link>}<button className="nav-button" onClick={logout}>Log out</button></> : <Link className="nav-cta" href="/login">Sign in</Link>;
}
