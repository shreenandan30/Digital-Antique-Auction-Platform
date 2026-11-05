import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/mysql";
import type { RowDataPacket } from "mysql2/promise";
import { getMongo } from "@/lib/mongodb";
import { errorResponse } from "@/lib/http";
import type { Document } from "mongodb";
export const dynamic = "force-dynamic";

type ActivitySummary = {
  total: number;
  byAction: Document[];
  recent: Document[];
  mostViewedAuctions: Document[];
  mostViewedAntiques: Document[];
};

export async function GET() {
  try {
    await requireAdmin();
    const [inventory, auctionSummary, bidSummary] = await Promise.all([
      query<RowDataPacket[]>("SELECT i.category,COUNT(*) AS item_count,AVG(val.estimated_value) AS avg_estimated_value FROM antique_item i LEFT JOIN valuation val ON val.valuation_id=(SELECT v2.valuation_id FROM valuation v2 WHERE v2.item_id=i.item_id ORDER BY v2.valuation_date DESC,v2.valuation_id DESC LIMIT 1) GROUP BY i.category ORDER BY item_count DESC"),
      query<RowDataPacket[]>("SELECT status,COUNT(*) AS auction_count FROM auction GROUP BY status"),
      query<RowDataPacket[]>("SELECT COUNT(*) AS bid_count,COALESCE(SUM(bid_amount),0) AS bid_total,COALESCE(AVG(bid_amount),0) AS bid_average,COALESCE(MAX(bid_amount),0) AS highest_bid,COALESCE(MIN(bid_amount),0) AS lowest_bid FROM bid"),
    ]);
    let activity: ActivitySummary = { total: 0, byAction: [], recent: [], mostViewedAuctions: [], mostViewedAntiques: [] };
    try {
      const collection = (await getMongo()).collection("auction_activity");
      const [total, byAction, recent, mostViewedAuctions, mostViewedAntiques] = await Promise.all([
        collection.countDocuments(),
        collection.aggregate([{ $group: { _id: "$action", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
        collection.aggregate([{ $sort: { createdAt: -1 } }, { $limit: 10 }, { $project: { userId: 1, action: 1, entityType: 1, entityId: 1, details: 1, createdAt: 1 } }]).toArray(),
        collection.aggregate([{ $match: { action: "VIEW_AUCTION" } }, { $group: { _id: "$entityId", views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 5 }]).toArray(),
        collection.aggregate([{ $match: { action: "VIEW_ANTIQUE" } }, { $group: { _id: "$entityId", views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 5 }]).toArray(),
      ]);
      activity = { total, byAction, recent, mostViewedAuctions, mostViewedAntiques };
    } catch {
      // MongoDB is secondary; business dashboard data remains available without activity logs.
    }
    return Response.json({ inventory, auctionSummary, bidSummary, activity });
  } catch (error) {
    return errorResponse(error);
  }
}
