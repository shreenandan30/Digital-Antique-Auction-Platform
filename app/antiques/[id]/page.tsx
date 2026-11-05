import { Collection } from "@/components/collection";
export default function Antique({params}:{params:{id:string}}){return <section className="wrap"><header className="page-head"><a className="text-link" href="/antiques">← All antiques</a></header><Collection type="antiques" id={params.id}/></section>}
