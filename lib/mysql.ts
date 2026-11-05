/* eslint-disable no-var */
import "server-only";
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

declare global { // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined
}
export function getPool(): Pool {
  if (!process.env.MYSQL_HOST) throw new Error("MYSQL_HOST is not configured. Copy .env.example to .env.local and set the database credentials.");
  const database = process.env.MYSQL_DATABASE || "antique_auction_db";
  if (database !== "antique_auction_db") throw new Error(`MYSQL_DATABASE must be antique_auction_db (received ${database}).`);
  if (!global.mysqlPool) global.mysqlPool = mysql.createPool({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), user: process.env.MYSQL_USER || "root", password: process.env.MYSQL_PASSWORD || "", database, waitForConnections: true, connectionLimit: 10, queueLimit: 0, decimalNumbers: true, dateStrings: true });
  return global.mysqlPool;
}
type SQLValue = string | number | bigint | boolean | Date | null;
export async function query<T extends RowDataPacket[]>(sql: string, values: SQLValue[] = []): Promise<T> { const [rows] = await getPool().execute<T>(sql, values); return rows; }
export async function execute(sql: string, values: SQLValue[] = []): Promise<ResultSetHeader> { const [result] = await getPool().execute<ResultSetHeader>(sql, values); return result; }
