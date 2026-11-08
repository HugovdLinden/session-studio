import { z } from 'zod';
import { member, checkMutation, apiError, HttpError } from '@/lib/server-access';

export const dynamic = 'force-dynamic';
const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  context: z.object({ projectName:z.string().max(120).optional(),phase:z.string().max(120),
    goal:z.string().max(2000),hasPlan:z.boolean(),approved:z.boolean(),activities:z.array(z.string().max(200)).max(100) }),
});
const unavailable = 'Gerd is disconnected in this preview. Start the local companion, then choose Reconnect assistant. Your project and session plans have not changed.';

export async function GET() {
  try {
    await member();
    return Response.json({ configured: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await member();
    checkMutation(request);
    const input = await request.json();
    if (input && typeof input === 'object' && 'action' in input && typeof input.action === 'string'
        && ['cancel','voice_options','voice_context','voice_stop','voice_result','voice_test','voice_start'].includes(input.action)) throw new HttpError(503, unavailable);
    if (!requestSchema.safeParse(input).success) throw new HttpError(400, 'Check your message and selected project, then try again.');
    throw new HttpError(503, unavailable);
  } catch (error) {
    return apiError(error);
  }
}
