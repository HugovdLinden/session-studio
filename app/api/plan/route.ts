import { member, checkMutation, apiError } from '@/lib/server-access';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readCatalogue } from '@/lib/server-catalogue';
import { sampleChief } from '@/lib/chief';
import { facilitatorKnowledge } from '@/lib/knowledge';
import { validateGeneratedPlan } from '@/lib/validate-plan';
import { intakeSchema, sameOrigin } from '@/lib/validation';
export const dynamic='force-dynamic';
export async function POST(request:Request) {
 if(!sameOrigin(request))return NextResponse.json({error:'This request is not allowed.'},{status:403});
 try{await member();checkMutation(request);const body=z.object({intake:intakeSchema,demo:z.boolean(),pinnedMethodId:z.string().max(200).optional()}).parse(await request.json());const catalogue=await readCatalogue(body.demo);const output=body.pinnedMethodId?await sampleChief.rebuildWithPinnedMethod(body.intake,catalogue,body.demo,body.pinnedMethodId,facilitatorKnowledge):await sampleChief.generatePlan(body.intake,catalogue,body.demo,facilitatorKnowledge);const plan=validateGeneratedPlan(output,body.intake,catalogue,body.pinnedMethodId);return NextResponse.json({plan,chief:'sample-planner'});}
 catch(e){return apiError(e);}
}
