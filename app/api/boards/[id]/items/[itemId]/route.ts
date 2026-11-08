import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, setRemoved } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
// Deleting and commenting are the only edits the board allows.
export async function PATCH(request:Request,{params}:{params:Promise<{id:string;itemId:string}>}) {
 try{await member();checkMutation(request);const {id,itemId}=await params;const {removed}=z.object({removed:z.boolean()}).parse(await request.json());await setRemoved(id,itemId,removed);return NextResponse.json({ok:true});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'This change is not allowed.'},{status:400}):boardErrorResponse(e,'The item could not be updated. Please retry.');}
}
