import { AuthError } from "@/lib/auth";
export function errorResponse(error: unknown) { const status = error instanceof AuthError ? error.status : 500; const message = error instanceof Error ? error.message : "Unexpected server error."; if (status === 500) console.error(error); return Response.json({ error: status === 500 && !message.includes("not configured") ? "A server error occurred. Check database configuration and try again." : message }, { status }); }
export function asNumber(value: unknown) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; }
