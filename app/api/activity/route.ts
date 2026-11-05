import {requireAdmin} from "@/lib/auth";import {getMongo} from "@/lib/mongodb";import {errorResponse} from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(){try{await requireAdmin();const rows=await (await getMongo()).collection("auction_activity").aggregate([{$sort:{createdAt:-1}},{$limit:100}]).toArray();return Response.json(rows)}catch(e){return errorResponse(e)}}
