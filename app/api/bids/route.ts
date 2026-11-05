import { z } from "zod";
import { getPool } from "@/lib/mysql";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { logActivity } from "@/lib/mongodb";
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

export const dynamic = "force-dynamic";
const schema = z.object({ auctionId: z.number().int().positive(), amount: z.number().positive().finite() });
const BID_ID_LOCK = "antique_auction_db:bid_id_allocator";
type AuctionRow = RowDataPacket & { auction_id: number; status: string; bid_window_open: number; base_price: number };
type BidderRow = RowDataPacket & { bidder_id: number };
type HighestRow = RowDataPacket & { highest: number };
type LockRow = RowDataPacket & { acquired: number | null };
type NextIdRow = RowDataPacket & { next_bid_id: number };

export async function POST(request: Request) {
  let conn: PoolConnection | undefined;
  let transactionStarted = false;
  let idLockAcquired = false;
  try {
    const user = await requireUser();
    if (user.role === "admin") return Response.json({ error: "Administrators cannot place bids." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Enter a valid auction and positive bid amount." }, { status: 400 });

    const { auctionId, amount } = parsed.data;
    conn = await getPool().getConnection();
    await conn.beginTransaction();
    transactionStarted = true;

    const [auctionRows] = await conn.execute<AuctionRow[]>(
      `SELECT auction_id, status, base_price,
              CASE WHEN LOWER(status) IN ('upcoming','active','open','live')
                         AND CURRENT_DATE BETWEEN start_date AND end_date
                   THEN 1 ELSE 0 END AS bid_window_open
       FROM auction WHERE auction_id=? FOR UPDATE`,
      [auctionId],
    );
    const auction = auctionRows[0];
    if (!auction) throw Object.assign(new Error("Auction not found."), { status: 404 });
    if (Number(auction.bid_window_open) !== 1) {
      throw Object.assign(new Error("Bidding is available only during the scheduled auction dates."), { status: 409 });
    }

    const [accountRows] = await conn.execute<BidderRow[]>("SELECT bidder_id FROM bidder WHERE email=? LIMIT 1", [user.email]);
    if (!accountRows[0]) {
      throw Object.assign(new Error("Your account is not linked to a bidder profile. Ask an administrator to link it."), { status: 409 });
    }
    const bidderId = accountRows[0].bidder_id;
    const [highestRows] = await conn.execute<HighestRow[]>("SELECT COALESCE(MAX(bid_amount),0) AS highest FROM bid WHERE auction_id=?", [auctionId]);
    const currentHighest = Math.max(Number(highestRows[0].highest), Number(auction.base_price) || 0);
    if (amount <= currentHighest) {
      throw Object.assign(new Error(`Your bid must be higher than ${currentHighest}.`), { status: 409 });
    }

    // MySQL named locks serialize ID allocation across app connections. The lock
    // is held through commit; the existing bid table and its primary key stay unchanged.
    const [lockRows] = await conn.execute<LockRow[]>("SELECT GET_LOCK(?, 10) AS acquired", [BID_ID_LOCK]);
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw Object.assign(new Error("Could not reserve a bid number. Please try again."), { status: 503 });
    }
    idLockAcquired = true;
    const [idRows] = await conn.execute<NextIdRow[]>("SELECT COALESCE(MAX(bid_id),0)+1 AS next_bid_id FROM bid");
    const bidId = Number(idRows[0].next_bid_id);

    await conn.execute<ResultSetHeader>(
      "INSERT INTO bid (bid_id,auction_id,bidder_id,bid_amount,bid_time) VALUES (?,?,?,?,NOW())",
      [bidId, auctionId, bidderId, amount],
    );
    await conn.commit();
    transactionStarted = false;
    await logActivity(user.userId, "PLACE_BID", "auction", auctionId, `Bid ${amount}`);
    return Response.json({ bidId, message: "Bid placed." }, { status: 201 });
  } catch (error) {
    if (conn && transactionStarted) {
      try { await conn.rollback(); } catch (rollbackError) { console.error("Bid rollback failed:", rollbackError); }
    }
    const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status: number }).status) : undefined;
    if (status) return Response.json({ error: error instanceof Error ? error.message : "Bid rejected." }, { status });
    return errorResponse(error);
  } finally {
    if (conn && idLockAcquired) {
      try { await conn.execute("SELECT RELEASE_LOCK(?)", [BID_ID_LOCK]); } catch (error) { console.error("Bid ID lock release failed:", error); }
    }
    conn?.release();
  }
}
