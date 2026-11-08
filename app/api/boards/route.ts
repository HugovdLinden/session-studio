import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, createBoard } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
// Creates the workspace for one browser-local planner project.
export async function POST(request:Request) {
 try{await member();checkMutation(request);const body=z.object({projectId:z.string().uuid(),name:z.string().trim().min(1).max(120)}).parse(await request.json());return NextResponse.json({id:await createBoard(body.projectId,body.name)});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'The project could not be read.'},{status:400}):boardErrorResponse(e,'The workspace could not be created. Please retry.');}
}
