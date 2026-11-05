"use client";
import { useCallback, useEffect, useState } from "react";

type Review = { _id: string; userName: string; rating: number; comment: string; createdAt: string };
type Result = { feedback: Review[]; total: number; averageRating: number; page: number; hasMore: boolean };

export function FeedbackClient({ signedIn }: { signedIn: boolean }) {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const load = useCallback(async (nextPage = 1) => {
    setError("");
    try {
      const response = await fetch(`/api/feedback?page=${nextPage}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load feedback.");
      setData(current => nextPage === 1 ? result : { ...result, feedback: [...(current?.feedback ?? []), ...result.feedback] });
      setPage(nextPage);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load feedback."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: Number(values.get("rating")), comment: values.get("comment") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to submit feedback.");
      form.reset(); setMessage("Thank you for sharing your feedback."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit feedback."); }
    finally { setBusy(false); }
  }
  return <>
    <div className="feedback-summary"><div><strong>{data ? data.averageRating.toFixed(1) : "—"} <span className="stars" aria-label="average rating">★</span></strong><span>Average rating</span></div><div><strong>{data?.total ?? "—"}</strong><span>Total reviews</span></div></div>
    {signedIn ? <form className="feedback-form" onSubmit={submit}><h2 className="section-title">Share your experience</h2><div className="field"><label htmlFor="rating">Your rating</label><select className="select" id="rating" name="rating" required defaultValue="5">{[5,4,3,2,1].map(rating => <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>)}</select></div><div className="field"><label htmlFor="comment">Your feedback</label><textarea className="input feedback-textarea" id="comment" name="comment" required minLength={1} maxLength={2000} rows={4} placeholder="Tell us about your experience…" /></div>{message && <p className="success" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}<button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit feedback"}</button></form> : <p className="notice">Please <a className="text-link" href="/login">sign in</a> to leave feedback.</p>}
    <section className="feedback-list" aria-live="polite"><h2 className="section-title">Community reviews</h2>{!data && !error && <p className="loading">Loading feedback…</p>}{error && !data && <p className="notice" role="alert">{error} <button className="text-link feedback-retry" onClick={() => void load()}>Try again</button></p>}{data?.feedback.length === 0 && <p className="notice">No feedback yet. Be the first to share your experience.</p>}{data?.feedback.map(review => <article className="feedback-card" key={review._id}><div className="feedback-card-head"><div><h3>{review.userName}</h3><time className="meta" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</time></div><span className="stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div><p>{review.comment}</p></article>)}{data?.hasMore && <button className="btn secondary feedback-more" disabled={!data || Boolean(error)} onClick={() => void load(page + 1)}>Load more reviews</button>}</section>
  </>;
}
