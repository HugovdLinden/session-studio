import { NextResponse } from 'next/server';
import { z } from 'zod';
import { limits } from '@/lib/board';
import { addComment, boardErrorResponse } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string;itemId:string}>}) {
 try{await member();checkMutation(request);const {id,itemId}=await params;const body=z.object({author:z.string().max(limits.author).default(''),body:z.string().trim().min(1).max(limits.comment)}).parse(await request.json());return NextResponse.json(await addComment(id,itemId,body.author,body.body),{status:201});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:`Write a comment of up to ${limits.comment} characters.`},{status:400}):boardErrorResponse(e,'The comment could not be posted. Please retry.');}
}
