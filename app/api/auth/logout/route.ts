import {clearSession,currentUser,auditLogin} from "@/lib/auth";import {errorResponse} from "@/lib/http";
export const dynamic = "force-dynamic";
export async function POST(){try{const user=await currentUser();clearSession();if(user)await auditLogin(user.userId,"LOGOUT");return Response.json({ok:true})}catch(e){return errorResponse(e)}}
