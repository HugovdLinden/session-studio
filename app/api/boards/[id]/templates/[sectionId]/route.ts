import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, saveTemplate } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
export const dynamic='force-dynamic';
// Field values: text, list items, table rows or grid cells (see lib/templates.ts).
const value=z.union([z.string().max(5000),z.array(z.string().max(1000)).max(200),z.array(z.record(z.string().max(1000))).max(200),z.record(z.string().max(100))]);
const body=z.object({mode:z.enum(['digital','manual']),data:z.record(value),completed:z.boolean()});
export async function PUT(request:Request,{params}:{params:Promise<{id:string;sectionId:string}>}) {
 try{await member();checkMutation(request);const {id,sectionId}=await params;const input=body.parse(await request.json());return NextResponse.json(await saveTemplate(id,sectionId,input));}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'The template contains values that cannot be saved.'},{status:400}):boardErrorResponse(e,'The template could not be saved. Please retry.');}
}
