import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auction_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret || secret.length < 32) return NextResponse.redirect(new URL("/login", request.url));
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
