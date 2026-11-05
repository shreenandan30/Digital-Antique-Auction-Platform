import { currentUser } from "@/lib/auth";
import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";
export default async function FeedbackPage() {
  const user = await currentUser();
  return <section className="wrap"><header className="page-head"><div className="eyebrow">From our community</div><h1 className="display">User feedback</h1><p className="subtle">Read what collectors and bidders think about their experience.</p></header><FeedbackClient signedIn={Boolean(user)} /></section>;
}
