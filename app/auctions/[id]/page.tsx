import { Collection } from "@/components/collection";
import { currentUser } from "@/lib/auth";
export default async function Auction({params}:{params:{id:string}}){const user=await currentUser();return <section className="wrap"><header className="page-head"><a className="text-link" href="/auctions">← All auctions</a></header><Collection type="auctions" id={params.id} isAdmin={user?.role === "admin"}/></section>}
