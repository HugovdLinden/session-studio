import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, setCurrentSection } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
 try{await member();checkMutation(request);const {id}=await params;const {currentSectionId}=z.object({currentSectionId:z.string().max(200).nullable()}).parse(await request.json());await setCurrentSection(id,currentSectionId);return NextResponse.json({ok:true});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'Choose a step of this session.'},{status:400}):boardErrorResponse(e,'The session step could not be saved.');}
}
