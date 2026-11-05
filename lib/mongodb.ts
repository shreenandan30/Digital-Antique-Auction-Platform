/* eslint-disable no-var */
import "server-only";
import { MongoClient, type Db } from "mongodb";
declare global { // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined
}
export async function getMongo(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (!global.mongoClientPromise) global.mongoClientPromise = new MongoClient(uri).connect();
  return (await global.mongoClientPromise).db(process.env.MONGODB_DATABASE || "antique_auction_nosql");
}
export async function logActivity(userId: number | string | null, action: string, entityType: string, entityId: number | string | null, details = "") {
  try { const db = await getMongo(); await db.collection("auction_activity").insertOne({ userId: userId == null ? null : String(userId), action, entityType, entityId: entityId == null ? null : String(entityId), details, createdAt: new Date() }); } catch (error) { console.error("Activity logging unavailable:", error instanceof Error ? error.message : error); }
}
