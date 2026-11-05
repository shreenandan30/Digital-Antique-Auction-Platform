"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBidAmounts } from "@/lib/bid";

type Row = Record<string, unknown>;
function val(row: Row, ...keys: string[]) {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== "") return String(row[key]);
  return "—";
}
function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount) : value;
}

export function Collection({ type, id, limit, isAdmin = false }: { type: "antiques" | "auctions"; id?: string; limit?: number; isAdmin?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidError, setBidError] = useState(false);
  const url = id ? `/api/${type}/${id}` : `/api/${type}?${new URLSearchParams({ ...(search ? { search } : {}), ...(category ? { category } : {}), ...(status ? { status } : {}), ...(limit ? { limit: String(limit) } : {}) })}`;

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(url).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load data.");
      setRows(Array.isArray(data) ? data : [data]);
    }).catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load data.")).finally(() => setLoading(false));
  }, [url]);

  if (id) {
    const item = rows[0];
    if (loading) return <div className="loading">Loading details…</div>;
    if (error) return <div className="notice">{error}</div>;
    if (!item) return <div className="notice">Record not found.</div>;
    const heading = type === "antiques" ? val(item, "name") : val(item, "auction_name");
    const description = type === "antiques" ? val(item, "description") : val(item, "auction_description");
    const { previousHighest: highestBid, minimumNextBid: minimumBid } = getBidAmounts(item.highest_bid, item.base_price);
    async function placeBid(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault(); setBidMessage("");
      const form = new FormData(event.currentTarget);
      try {
        const response = await fetch("/api/bids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auctionId: Number(id), amount: Number(form.get("amount")) }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to place bid.");
        setBidMessage("Your bid was placed successfully."); setBidError(false);
      } catch (reason) { setBidMessage(reason instanceof Error ? reason.message : "Unable to place bid."); setBidError(true); }
    }
    return <div className="detail-grid"><div><span className="eyebrow">{type === "antiques" ? val(item, "category") : val(item, "item_name")}</span><h1 className="display">{heading}</h1><p className="subtle">{description}</p></div><div className="detail-panel">{Object.entries(item).filter(([key]) => !["description", "auction_description"].includes(key)).slice(0, 14).map(([key, value]) => <p key={key}><b>{key.replaceAll("_", " ")}</b> · {String(value ?? "—")}</p>)}{type === "auctions" && <><p><b>Previous highest bid:</b> {money(String(highestBid))}</p><p><b>Minimum next bid:</b> {money(String(minimumBid))}</p>{isAdmin ? <p className="notice">Administrators cannot place bids.</p> : Number(item.is_bid_open) === 1 ? <><p className="subtle">Your bid must be higher than the previous highest bid.</p><form onSubmit={placeBid}><div className="field"><label htmlFor="auction-bid-amount">Bid amount</label><input id="auction-bid-amount" name="amount" className="input" type="number" min={minimumBid} step="1" defaultValue={minimumBid} required /></div>{bidMessage && <p className={bidError ? "error" : "success"} role="status">{bidMessage}</p>}<button className="btn gold" type="submit">Place a bid</button></form></> : <p className="subtle">Bidding is available only during the scheduled auction dates.</p>}</>}</div></div>;
  }

  return <><div className="toolbar">{type === "antiques" ? <><input aria-label="Search antiques" className="input" placeholder="Search by antique name…" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter by category" className="select" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{[...new Set(rows.map(row => String(row.category || "")).filter(Boolean))].map(value => <option key={value}>{value}</option>)}</select></> : <select aria-label="Filter by auction status" className="select" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option><option>Upcoming</option><option>Active</option><option>Closed</option></select>}</div>
    {loading ? <div className="loading">Loading {type}…</div> : error ? <div className="notice">{error}</div> : rows.length === 0 ? <div className="notice">No {type} found.</div> : <div className="grid">{rows.map((row, index) => {
      const key = val(row, type === "antiques" ? "item_id" : "auction_id");
      const name = type === "antiques" ? val(row, "name") : val(row, "auction_name");
      const imageLabel = type === "antiques" ? val(row, "category") : val(row, "item_name");
      const meta = type === "antiques"
        ? [val(row, "year_made"), val(row, "origin"), val(row, "condition_status")].filter(value => value !== "—").join(" · ")
        : [val(row, "item_name"), val(row, "status"), val(row, "start_date")].filter(value => value !== "—").join(" · ");
      return <Link className="card" href={`/${type}/${key}`} key={`${key}-${index}`}><div className="card-art">{imageLabel}</div><div className="card-body"><h3>{name}</h3><div className="meta">{meta}</div><div className="price">{money(val(row, "estimated_value", "highest_bid", "base_price"))}</div></div></Link>;
    })}</div>}
  </>;
}
