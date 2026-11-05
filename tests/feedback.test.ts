import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMongo, requireUser, collection } = vi.hoisted(() => {
  const collection = {
    createIndex: vi.fn(), insertOne: vi.fn(), countDocuments: vi.fn(), aggregate: vi.fn(), find: vi.fn(),
  };
  return { getMongo: vi.fn(), requireUser: vi.fn(), collection };
});
vi.mock("@/lib/auth", () => ({ requireUser }));
vi.mock("@/lib/http", () => ({ errorResponse: (error: unknown) => Response.json({ error: error instanceof Error ? error.message : "error" }, { status: typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 500 }) }));
vi.mock("@/lib/mongodb", () => ({ getMongo }));
import { GET, POST } from "@/app/api/feedback/route";

function request(body: unknown) { return new Request("http://localhost/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
function setupRows(rows: Record<string, unknown>[], total: number, averageRating: number) {
  collection.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => rows }) }) }) });
  collection.countDocuments.mockResolvedValue(total);
  collection.aggregate.mockReturnValue({ toArray: async () => total ? [{ averageRating }] : [] });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMongo.mockResolvedValue({ collection: () => collection });
  collection.createIndex.mockResolvedValue("idx_user_feedback_created");
});

describe("feedback API", () => {
  it("fetches feedback and rating statistics newest first", async () => {
    const rows = [{ _id: "b", userName: "Bea", rating: 5, comment: "Lovely", createdAt: new Date("2026-01-02") }, { _id: "a", userName: "Ada", rating: 3, comment: "Good", createdAt: new Date("2026-01-01") }];
    setupRows(rows, 2, 4);
    const response = await GET(new Request("http://localhost/api/feedback"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ total: 2, averageRating: 4, feedback: [{ userName: "Bea" }, { userName: "Ada" }] });
    expect(collection.find).toHaveBeenCalledWith({}, { projection: { userId: 0 } });
    expect(collection.createIndex).toHaveBeenCalledWith({ createdAt: -1 }, expect.any(Object));
  });

  it("submits valid feedback with identity taken from the verified session", async () => {
    requireUser.mockResolvedValue({ userId: 12, fullName: "Ada Lovelace", email: "ada@example.com", role: "user" });
    collection.insertOne.mockResolvedValue({ insertedId: "review-1" });
    const response = await POST(request({ rating: 5, comment: "Wonderful collection", userId: 999, userName: "Imposter" }));
    expect(response.status).toBe(201);
    expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({ userId: "12", userName: "Ada Lovelace", rating: 5, comment: "Wonderful collection" }));
    expect(collection.insertOne.mock.calls[0][0]).not.toHaveProperty("email");
  });

  it("rejects empty comments", async () => {
    requireUser.mockResolvedValue({ userId: 12, fullName: "Ada", role: "user" });
    expect((await POST(request({ rating: 3, comment: "  " }))).status).toBe(400);
    expect(collection.insertOne).not.toHaveBeenCalled();
  });

  it("rejects ratings outside the integer 1 to 5 range", async () => {
    requireUser.mockResolvedValue({ userId: 12, fullName: "Ada", role: "user" });
    expect((await POST(request({ rating: 6, comment: "Fine" }))).status).toBe(400);
    expect((await POST(request({ rating: 2.5, comment: "Fine" }))).status).toBe(400);
    expect(collection.insertOne).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated submissions", async () => {
    requireUser.mockRejectedValue({ status: 401, message: "Please sign in." });
    const response = await POST(request({ rating: 5, comment: "Hello" }));
    expect(response.status).toBe(401);
    expect(collection.insertOne).not.toHaveBeenCalled();
  });

  it("returns reviews from multiple users", async () => {
    setupRows([{ _id: "1", userName: "Ada", rating: 4, comment: "A", createdAt: new Date() }, { _id: "2", userName: "Bea", rating: 5, comment: "B", createdAt: new Date() }], 2, 4.5);
    const response = await GET(new Request("http://localhost/api/feedback"));
    expect((await response.json()).feedback.map((review: { userName: string }) => review.userName)).toEqual(["Ada", "Bea"]);
  });

  it("handles an empty feedback collection", async () => {
    setupRows([], 0, 0);
    const response = await GET(new Request("http://localhost/api/feedback"));
    expect(await response.json()).toMatchObject({ feedback: [], total: 0, averageRating: 0, hasMore: false });
  });

  it("calculates the average rating from the aggregate result", async () => {
    setupRows([], 3, 4);
    const response = await GET(new Request("http://localhost/api/feedback"));
    expect((await response.json()).averageRating).toBe(4);
    expect(collection.aggregate).toHaveBeenCalledWith([{ $group: { _id: null, averageRating: { $avg: "$rating" } } }]);
  });
});
