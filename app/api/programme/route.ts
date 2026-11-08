import { z } from 'zod';
import { member, checkMutation, apiError } from '@/lib/server-access';
import { readCatalogue } from '@/lib/server-catalogue';
import { programmeInputSchema } from '@/lib/programme';
import { facilitatorConfigured, requestProgramme } from '@/lib/programme-service';
export const dynamic='force-dynamic';
export async function GET(){try{await member();return Response.json({configured:facilitatorConfigured()},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiError(error);}}
export async function POST(request:Request){try{await member();checkMutation(request);const body=z.object({name:z.string().trim().min(1).max(120),description:z.string().max(1500),input:programmeInputSchema}).parse(await request.json());const project=await requestProgramme(body.name,body.description,body.input,await readCatalogue());return Response.json({project,source:'facilitator'},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiError(error);}}
