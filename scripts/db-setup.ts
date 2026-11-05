import mysql, { type RowDataPacket } from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type SchemaRow = { table_name: string; column_name: string };
type CountRow = { n: number };
type NameRow = { name: string };
type TriggerRow = { action_statement: string };

const requiredColumns: Record<string, string[]> = {
  antique_item: ["item_id", "owner_id", "name", "category", "description", "year_made", "origin", "condition_status", "current_status"],
  owner: ["owner_id", "name", "phone", "email", "address"],
  auction: ["auction_id", "item_id", "name", "description", "start_date", "end_date", "location", "base_price", "status", "auction_type"],
  bid: ["bid_id", "auction_id", "bidder_id", "bid_amount", "bid_time"],
  bidder: ["bidder_id", "name", "phone", "email", "address", "registration_date"],
  payment: ["payment_id", "transaction_id", "amount", "payment_date", "payment_method", "status"],
  provenance: ["provenance_id", "item_id", "previous_owner", "from_year", "to_year", "acquisition_method", "details"],
  transaction: ["transaction_id", "auction_id", "winning_bidder_id", "final_price", "transaction_date"],
  valuation: ["valuation_id", "item_id", "estimated_value", "valuation_date", "expert_id", "expert_name", "method", "remarks"],
};
const expectedViewColumns = ["auction_id", "auction_name", "item_name", "base_price", "start_date", "end_date", "status"];

async function main() {
  if (!process.env.MYSQL_HOST) throw new Error("Configure MYSQL_HOST and related variables in .env.local first.");
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "antique_auction_db",
  });

  try {
    const [[database]] = await db.query<(NameRow & RowDataPacket)[]>("SELECT DATABASE() AS name");
    if (database.name !== "antique_auction_db") throw new Error(`Refusing setup: connected to ${database.name}, expected antique_auction_db.`);

    const [schemaRows] = await db.query<(SchemaRow & RowDataPacket)[]>(
      "SELECT table_name AS table_name, column_name AS column_name FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY table_name, ordinal_position",
    );
    const schema = new Map<string, Set<string>>();
    for (const row of schemaRows) {
      const columns = schema.get(row.table_name) ?? new Set<string>();
      columns.add(row.column_name);
      schema.set(row.table_name, columns);
    }
    const missing = Object.entries(requiredColumns).flatMap(([table, columns]) =>
      columns.filter(column => !schema.get(table)?.has(column)).map(column => `${table}.${column}`),
    );
    if (missing.length) throw new Error(`Refusing setup: authoritative schema is missing ${missing.join(", ")}.`);

    const actualViewColumns = [...(schema.get("auction_details") ?? [])];
    if (actualViewColumns.length !== expectedViewColumns.length || expectedViewColumns.some((column, index) => actualViewColumns[index] !== column)) {
      throw new Error(`Refusing setup: auction_details must match the dump columns (${expectedViewColumns.join(", ")}).`);
    }

    const [triggers] = await db.query<(TriggerRow & RowDataPacket)[]>(
      "SELECT action_statement AS action_statement FROM information_schema.triggers WHERE trigger_schema=DATABASE() AND trigger_name='after_auction_insert' AND event_object_table='auction'",
    );
    const triggerSql = triggers[0]?.action_statement.toLowerCase().replace(/`/g, "").replace(/\s+/g, " ") ?? "";
    if (!triggerSql.includes("set current_status = 'auctioned'") || !triggerSql.includes("where item_id = new.item_id")) {
      throw new Error("Refusing setup: expected after_auction_insert trigger (current_status = 'Auctioned') was not found. Existing triggers are never replaced.");
    }

    // This is the first mutation. Existing business tables, sample rows, view,
    // and trigger have all been checked above and are never dropped or replaced.
    await db.query(await readFile(resolve("database/schema/user_account.sql"), "utf8"));

    const indexes = [
      ["auction", "idx_auction_status", "status"],
      ["auction", "idx_auction_start_date", "start_date"],
      ["antique_item", "idx_antique_category", "category"],
      ["antique_item", "idx_antique_current_status", "current_status"],
    ] as const;
    for (const [table, name, column] of indexes) {
      const [[exists]] = await db.query<(CountRow & RowDataPacket)[]>(
        "SELECT COUNT(*) AS n FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND column_name=? AND seq_in_index=1",
        [table, column],
      );
      if (!exists.n) {
        await db.query(`CREATE INDEX \`${name}\` ON \`${table}\` (\`${column}\`)`);
        console.log(`Created ${name}.`);
      } else {
        console.log(`Kept existing ${table} index on ${column}.`);
      }
    }

    const [[procedure]] = await db.query<(CountRow & RowDataPacket)[]>(
      "SELECT COUNT(*) AS n FROM information_schema.routines WHERE routine_schema=DATABASE() AND routine_name='GetAuctionDetails' AND routine_type='PROCEDURE'",
    );
    if (!procedure.n) {
      await db.query(`CREATE PROCEDURE GetAuctionDetails(IN p_auction_id INT)
        BEGIN
          SELECT d.auction_id, d.auction_name, d.item_name AS antique_name,
                 d.base_price, d.start_date, d.end_date, d.status,
                 COALESCE((SELECT MAX(b.bid_amount) FROM bid b WHERE b.auction_id=d.auction_id),0) AS highest_bid
          FROM auction_details d WHERE d.auction_id=p_auction_id;
        END`);
    }

    const [[functionExists]] = await db.query<(CountRow & RowDataPacket)[]>(
      "SELECT COUNT(*) AS n FROM information_schema.routines WHERE routine_schema=DATABASE() AND routine_name='GetHighestBid' AND routine_type='FUNCTION'",
    );
    if (!functionExists.n) {
      await db.query(`CREATE FUNCTION GetHighestBid(p_auction_id INT) RETURNS DECIMAL(12,2)
        DETERMINISTIC READS SQL DATA
        BEGIN
          DECLARE v_highest DECIMAL(12,2);
          SELECT COALESCE(MAX(bid_amount),0) INTO v_highest FROM bid WHERE auction_id=p_auction_id;
          RETURN v_highest;
        END`);
    }

    console.log("Database setup complete. The existing nine tables, sample rows, auction_details view, and after_auction_insert trigger were preserved.");
  } finally {
    await db.end();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
