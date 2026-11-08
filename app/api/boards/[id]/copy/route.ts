import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, copyBoard } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
// Imported project copies get a duplicate workspace so edits never reach the original.
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 try{await member();checkMutation(request);const {id}=await params;const {projectId}=z.object({projectId:z.string().uuid()}).parse(await request.json());return NextResponse.json({id:await copyBoard(id,projectId)});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'The project could not be read.'},{status:400}):boardErrorResponse(e,'The workspace could not be copied.');}
}
