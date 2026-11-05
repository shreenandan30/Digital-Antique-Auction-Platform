import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { UserMenu } from "@/components/user-menu";

export const metadata: Metadata = { title: "Antique Auction | Discover rare pieces", description: "Antique Auction Management System — discover, value and bid on exceptional antiques." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><header className="site-header"><Link className="brand" href="/"><span className="brand-mark">A</span><span>ANTIQUE<span className="brand-light"> AUCTION</span></span></Link><nav className="nav"><Link href="/antiques">Antiques</Link><Link href="/auctions">Auctions</Link><Link href="/feedback">Feedback</Link><UserMenu /></nav></header><main>{children}</main><footer className="footer"><span>Antique Auction Management System</span></footer></body></html>;
}
