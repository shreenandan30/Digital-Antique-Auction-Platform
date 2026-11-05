import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mysql", () => ({ query: vi.fn(), execute: vi.fn(), getPool: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  AuthError: class AuthError extends Error { constructor(public status: number, message: string) { super(message); } },
  currentUser: vi.fn(), requireUser: vi.fn(), requireAdmin: vi.fn(), createSession: vi.fn(),
  findAccount: vi.fn(), auditLogin: vi.fn(),
}));
vi.mock("@/lib/mongodb", () => ({ logActivity: vi.fn(), getMongo: vi.fn() }));
vi.mock("@/lib/auction", () => ({ listAuctions: vi.fn(), auctionSelect: "SELECT a.auction_id", auctionGroup: " GROUP BY a.auction_id" }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "$2a$12$test-hash"), compare: vi.fn(async () => true) } }));

import { query, execute, getPool } from "@/lib/mysql";
import { AuthError, currentUser, requireUser, requireAdmin, createSession, findAccount, auditLogin } from "@/lib/auth";
import { logActivity } from "@/lib/mongodb";
import { listAuctions } from "@/lib/auction";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as antiques } from "@/app/api/antiques/route";
import { GET as auctions } from "@/app/api/auctions/route";
import { POST as placeBid } from "@/app/api/bids/route";
import { GET as myBids } from "@/app/api/my-bids/route";
import { GET as myTransactions } from "@/app/api/my-transactions/route";
import { GET as adminDashboard } from "@/app/api/admin/dashboard/route";

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => vi.clearAllMocks());

describe("API handlers", () => {
  it("registers accounts with a hashed password and user role", async () => {
    vi.mocked(execute).mockResolvedValue({ insertId: 9 } as never);
    const response = await register(jsonRequest("http://localhost/api/auth/register", { fullName: "Ada Lovelace", email: "ADA@example.com", password: "strong-pass" }));
    expect(response.status).toBe(201);
    expect(vi.mocked(execute).mock.calls[0][1]?.[2]).toBe("$2a$12$test-hash");
    expect(vi.mocked(execute).mock.calls[0][0]).toContain("password_hash");
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, role: "user" }));
    expect(logActivity).toHaveBeenCalled();
  });

  it("logs a user in and rejects invalid login", async () => {
    vi.mocked(findAccount).mockResolvedValue({ user_id: 2, full_name: "Ada", email: "ada@example.com", password_hash: "hash", role: "user" } as never);
    expect((await login(jsonRequest("http://localhost/api/auth/login", { email: "ada@example.com", password: "secret123" }))).status).toBe(200);
    vi.mocked(findAccount).mockResolvedValue(null);
    expect((await login(jsonRequest("http://localhost/api/auth/login", { email: "ada@example.com", password: "wrong" }))).status).toBe(401);
  });

  it("returns antique rows from the database query", async () => {
    vi.mocked(query).mockResolvedValue([{ item_id: 3, name: "Bronze bowl" }] as never);
    vi.mocked(currentUser).mockResolvedValue(null);
    const response = await antiques(new Request("http://localhost/api/antiques?search=bronze&category=Decor"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ item_id: 3, name: "Bronze bowl" }]);
    expect(vi.mocked(query).mock.calls[0][1]).toEqual(["bronze", "%bronze%", "Decor", "Decor"]);
  });

  it("returns auction rows from the auction listing query", async () => {
    vi.mocked(listAuctions).mockResolvedValue([{ auction_id: 5, status: "active" }] as never);
    vi.mocked(currentUser).mockResolvedValue(null);
    const response = await auctions(new Request("http://localhost/api/auctions?status=active"));
    expect(response.status).toBe(200);
    expect(listAuctions).toHaveBeenCalledWith("active", 100);
  });

  it("rejects invalid bids before opening a database transaction", async () => {
    vi.mocked(requireUser).mockResolvedValue({ userId: 4, fullName: "Ada", email: "ada@example.com", role: "user" });
    const response = await placeBid(jsonRequest("http://localhost/api/bids", { auctionId: 3, amount: 0 }));
    expect(response.status).toBe(400);
    expect(getPool).not.toHaveBeenCalled();
  });

  it("rejects admin bid attempts before database or activity writes", async () => {
    vi.mocked(requireUser).mockResolvedValue({ userId: 1, fullName: "Admin", email: "admin@example.com", role: "admin" });
    const response = await placeBid(jsonRequest("http://localhost/api/bids", { auctionId: 3, amount: 75 }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Administrators cannot place bids." });
    expect(getPool).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
  });

  it("rolls back bids when the auction date window is closed", async () => {
    vi.mocked(requireUser).mockResolvedValue({ userId: 4, fullName: "Ada", email: "ada@example.com", role: "user" });
    const connection = {
      beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(),
      execute: vi.fn().mockResolvedValueOnce([[{ auction_id: 3, status: "Upcoming", bid_window_open: 0 }], []]),
    };
    vi.mocked(getPool).mockReturnValue({ getConnection: vi.fn().mockResolvedValue(connection) } as never);
    const response = await placeBid(jsonRequest("http://localhost/api/bids", { auctionId: 3, amount: 75 }));
    expect(response.status).toBe(409);
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.execute).toHaveBeenCalledOnce();
  });

  it("places a bid inside a committed transaction", async () => {
    vi.mocked(requireUser).mockResolvedValue({ userId: 4, fullName: "Ada", email: "ada@example.com", role: "user" });
    const connection = {
      beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(),
      execute: vi.fn()
        .mockResolvedValueOnce([[{ auction_id: 3, status: "Upcoming", bid_window_open: 1 }], []])
        .mockResolvedValueOnce([[{ bidder_id: 7 }], []])
        .mockResolvedValueOnce([[{ highest: 50 }], []])
        .mockResolvedValueOnce([[{ acquired: 1 }], []])
        .mockResolvedValueOnce([[{ next_bid_id: 42 }], []])
        .mockResolvedValueOnce([{ insertId: 42 }, []]),
    };
    vi.mocked(getPool).mockReturnValue({ getConnection: vi.fn().mockResolvedValue(connection) } as never);
    const response = await placeBid(jsonRequest("http://localhost/api/bids", { auctionId: 3, amount: 75 }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ bidId: 42 });
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.execute.mock.calls[3][0]).toContain("GET_LOCK");
    expect(connection.execute.mock.calls[4][0]).toContain("MAX(bid_id)");
    expect(connection.execute.mock.calls[5][0]).toContain("(bid_id,auction_id,bidder_id,bid_amount,bid_time)");
    expect(connection.execute.mock.calls[5][1]).toEqual([42, 3, 7, 75]);
  });

  it.each([50, 49])("rejects a bid at or below the current highest bid (%s)", async amount => {
    vi.mocked(requireUser).mockResolvedValue({ userId: 4, fullName: "Ada", email: "ada@example.com", role: "user" });
    const connection = {
      beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(),
      execute: vi.fn()
        .mockResolvedValueOnce([[{ auction_id: 3, status: "Active", bid_window_open: 1 }], []])
        .mockResolvedValueOnce([[{ bidder_id: 7 }], []])
        .mockResolvedValueOnce([[{ highest: 50 }], []]),
    };
    vi.mocked(getPool).mockReturnValue({ getConnection: vi.fn().mockResolvedValue(connection) } as never);
    const response = await placeBid(jsonRequest("http://localhost/api/bids", { auctionId: 3, amount }));
    expect(response.status).toBe(409);
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
  });

  it("blocks unauthenticated personal records and non-admin dashboard access", async () => {
    vi.mocked(requireUser).mockRejectedValue(new AuthError(401, "Sign in required"));
    expect((await myBids()).status).toBe(401);
    vi.mocked(requireUser).mockResolvedValue({ userId: 4, fullName: "Ada", email: "ada@example.com", role: "user" });
    vi.mocked(query).mockResolvedValue([] as never);
    expect((await myBids()).status).toBe(200);
    expect(vi.mocked(query).mock.calls.at(-1)?.[1]).toEqual(["ada@example.com"]);
    expect((await myTransactions()).status).toBe(200);
    expect(vi.mocked(query).mock.calls.at(-1)?.[1]).toEqual(["ada@example.com"]);
    vi.mocked(requireAdmin).mockRejectedValue(new AuthError(403, "Admin required"));
    expect((await adminDashboard()).status).toBe(403);
  });
});
