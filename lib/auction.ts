import "server-only";
import { query } from "@/lib/mysql";
import type { RowDataPacket } from "mysql2/promise";

const valuationJoin = `LEFT JOIN valuation val ON val.valuation_id = (
  SELECT v2.valuation_id FROM valuation v2
  WHERE v2.item_id = i.item_id
  ORDER BY v2.valuation_date DESC, v2.valuation_id DESC LIMIT 1
)`;
const bidJoin = `LEFT JOIN (
  SELECT auction_id, MAX(bid_amount) AS highest_bid
  FROM bid GROUP BY auction_id
) bid_summary ON bid_summary.auction_id = a.auction_id`;

// auction_details is part of the supplied schema. Keep its auction_name/item_name
// aliases and join it back to the base tables for fields the view does not expose.
export const auctionSelect = `
  SELECT d.auction_id, a.item_id, d.auction_name, d.item_name,
         a.description AS auction_description, a.location, a.auction_type,
         d.base_price, d.start_date, d.end_date, d.status,
         i.category, i.year_made, i.origin, i.condition_status,
         val.estimated_value, val.valuation_date,
         COALESCE(bid_summary.highest_bid, 0) AS highest_bid,
         CASE WHEN LOWER(d.status) IN ('upcoming','active','open','live')
                   AND CURRENT_DATE BETWEEN d.start_date AND d.end_date
              THEN 1 ELSE 0 END AS is_bid_open
  FROM auction_details d
  JOIN auction a ON a.auction_id = d.auction_id
  JOIN antique_item i ON i.item_id = a.item_id
  ${valuationJoin}
  ${bidJoin}`;

export async function listAuctions(status?: string, limit?: number) {
  const where = status && status.toLowerCase() !== "all" ? " WHERE LOWER(d.status) = LOWER(?)" : "";
  const sql = `${auctionSelect}${where} ORDER BY d.start_date DESC${limit ? " LIMIT ?" : ""}`;
  return query<RowDataPacket[]>(sql, [...(where && status ? [status] : []), ...(limit ? [limit] : [])]);
}
