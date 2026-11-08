import { NextResponse } from 'next/server';
import { z } from 'zod';
import { boardErrorResponse, syncProject } from '@/lib/board-server';
import { checkMutation, member } from '@/lib/server-access';
import { intakeSchema, planSchema } from '@/lib/validation';
export const dynamic='force-dynamic';
const body=z.object({projectId:z.string().uuid(),name:z.string().trim().min(1).max(120),description:z.string().max(1500),sessions:z.array(z.object({id:z.string().uuid(),title:z.string().max(160),status:z.enum(['draft','approved','completed']),intake:intakeSchema,plan:planSchema.nullable()})).min(1).max(120)});
// Mirrors the planner project's sessions into its workspace (the planner stays the source of truth).
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
 try{await member();checkMutation(request);const {id}=await params;const p=body.parse(await request.json());
  const board=await syncProject(id,{projectId:p.projectId,name:p.name,description:p.description,sessions:p.sessions.map(s=>({id:s.id,title:s.title,status:s.status,intake:s.intake,activities:s.plan?.activities??[]}))});
  return NextResponse.json({board});}
 catch(e){return e instanceof z.ZodError?NextResponse.json({error:'The project could not be read.'},{status:400}):boardErrorResponse(e,'The workspace could not be updated. Please retry.');}
}
