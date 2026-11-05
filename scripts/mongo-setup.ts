import { MongoClient } from "mongodb";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || "antique_auction_nosql");
    const existing = await db.listCollections({ name: "auction_activity" }).hasNext();
    if (!existing) await db.createCollection("auction_activity");
    const activity = db.collection("auction_activity");
    await activity.createIndex({ action: 1, createdAt: -1 }, { name: "idx_activity_action_created" });
    await activity.createIndex({ entityType: 1, entityId: 1 }, { name: "idx_activity_entity" });
    console.log(`MongoDB ready: ${db.databaseName}.auction_activity`);
  } finally {
    await client.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
