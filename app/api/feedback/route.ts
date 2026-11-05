import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { getMongo } from "@/lib/mongodb";

const collectionName = "user_feedback";
const pageSize = 20;
const inputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Please enter a comment.").max(2000, "Comment must be 2,000 characters or fewer."),
});

async function feedbackCollection() {
  const collection = (await getMongo()).collection(collectionName);
  await collection.createIndex({ createdAt: -1 }, { name: "idx_user_feedback_created" });
  return collection;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsedPage = Number(url.searchParams.get("page") ?? 1);
    const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 100000) : 1;
    const collection = await feedbackCollection();
    const [items, count, summary] = await Promise.all([
      collection.find({}, { projection: { userId: 0 } }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      collection.countDocuments(),
      collection.aggregate([{ $group: { _id: null, averageRating: { $avg: "$rating" } } }]).toArray(),
    ]);
    return Response.json({
      feedback: items.map(item => ({ ...item, _id: String(item._id), createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt })),
      total: count,
      averageRating: summary[0]?.averageRating ?? 0,
      page,
      pageSize,
      hasMore: page * pageSize < count,
    });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Please submit valid JSON." }, { status: 400 }); }
    const payload = inputSchema.safeParse(body);
    if (!payload.success) return Response.json({ error: payload.error.issues[0]?.message ?? "Invalid feedback." }, { status: 400 });
    const now = new Date();
    const result = await (await feedbackCollection()).insertOne({
      userId: String(user.userId),
      userName: user.fullName,
      rating: payload.data.rating,
      comment: payload.data.comment,
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({ feedback: { _id: String(result.insertedId), userName: user.fullName, rating: payload.data.rating, comment: payload.data.comment, createdAt: now.toISOString() } }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
