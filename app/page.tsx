import Link from "next/link";
import { query } from "@/lib/mysql";
import type { RowDataPacket } from "mysql2/promise";
import { Collection } from "@/components/collection";
import { getMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
async function count(sql: string) { try { const r = await query<(RowDataPacket & { total: number })[]>(sql); return Number(r[0]?.total ?? 0); } catch { return null; } }
async function latestFeedback() {
  try {
    const collection = (await getMongo()).collection("user_feedback");
    const items = await collection.find({}, { projection: { userId: 0 } }).sort({ createdAt: -1, _id: -1 }).limit(3).toArray();
    return items.map(item => ({ id: String(item._id), userName: String(item.userName ?? "Collector"), rating: Number(item.rating), comment: String(item.comment ?? ""), createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt ?? "") }));
  } catch { return []; }
}
export default async function Home() {
  const [antiques, active, bids, reviews] = await Promise.all([count("SELECT COUNT(*) AS total FROM antique_item"), count("SELECT COUNT(*) AS total FROM auction WHERE LOWER(status)='active'"), count("SELECT COUNT(*) AS total FROM bid"), latestFeedback()]);
  return <><section className="hero"><div className="wrap hero-grid"><div><div className="eyebrow">A collection of stories</div><h1 className="display">ANTIQUE<br/>AUCTION</h1><p>Discover rare and valuable antiques, each with a history worth knowing. Find your next piece among our carefully catalogued collection.</p><div className="actions"><Link className="btn" href="/antiques">Browse antiques</Link><Link className="btn secondary" href="/auctions">View auctions</Link></div></div><div className="hero-art" aria-label="Antique auction collection"><span className="art-note">Objects with a past. Yours to discover.</span></div></div></section>
  <section className="wrap stats"><div className="stat"><strong>{antiques === null ? "—" : antiques.toLocaleString("en-IN")}</strong><span>Total antiques</span></div><div className="stat"><strong>{active === null ? "—" : active.toLocaleString("en-IN")}</strong><span>Active auctions</span></div><div className="stat"><strong>{bids === null ? "—" : bids.toLocaleString("en-IN")}</strong><span>Total bids</span></div></section>
  <section className="wrap section"><div className="section-head"><div><div className="eyebrow">Handpicked for you</div><h2 className="section-title">Featured antiques</h2></div><Link className="text-link" href="/antiques">View all antiques →</Link></div><Collection type="antiques" limit={6}/></section>
  <section className="wrap section"><div className="section-head"><div><div className="eyebrow">The next opportunity</div><h2 className="section-title">Upcoming auctions</h2></div><Link className="text-link" href="/auctions">View all auctions →</Link></div><Collection type="auctions" limit={6}/></section>
  <section className="wrap section"><div className="section-head"><div><div className="eyebrow">Collector stories</div><h2 className="section-title">Latest feedback</h2></div><Link className="text-link" href="/feedback">View all feedback →</Link></div>{reviews.length ? <div className="grid">{reviews.map(review => <article className="feedback-card" key={review.id}><div className="feedback-card-head"><div><h3>{review.userName}</h3><time className="meta" dateTime={review.createdAt}>{review.createdAt && new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></div><span className="stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}{"☆".repeat(5-Math.max(0, Math.min(5, review.rating)))}</span></div><p>{review.comment.length > 180 ? `${review.comment.slice(0, 180)}…` : review.comment}</p></article>)}</div> : <p className="notice">No reviews have been shared yet.</p>}</section></>;
}
