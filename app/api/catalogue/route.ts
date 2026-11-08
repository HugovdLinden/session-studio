import { member, checkMutation, apiError } from '@/lib/server-access';
import { NextResponse } from 'next/server';
import { readCatalogue, saveMetadata } from '@/lib/server-catalogue';
import { ratingsSchema, sameOrigin } from '@/lib/validation';
import { z } from 'zod';
import { facilitatorKnowledge } from '@/lib/knowledge';
export const dynamic='force-dynamic';
export async function GET() { try{await member();return NextResponse.json({methods:await readCatalogue(),knowledge:facilitatorKnowledge}, {headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);} }
export async function PATCH(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:'This request is not allowed.'},{status:403});
 try{await member();checkMutation(request);const body=z.object({id:z.string().max(200),revision:z.number().int().min(0),ratings:ratingsSchema}).parse(await request.json());const result=await saveMetadata(body.id,body.ratings,body.revision);return NextResponse.json(result);}
 catch(e){return apiError(e);}
}
