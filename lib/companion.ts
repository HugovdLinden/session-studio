import { z } from 'zod';
import { allocate, minimum } from './engine';
import type { Project } from './projects';

export const companionEditSchema = z.object({ kind: z.enum(['session_duration', 'activity_duration']), sessionId: z.string().uuid(), activityId: z.string().max(200), minutes: z.number().int().min(1).max(720) }).strict();
export type CompanionEdit = z.infer<typeof companionEditSchema>;
export interface CompanionPlanner { projectId: string; revision: number; sessions: { id: string; title: string; minutes: number; status: 'draft'|'approved'|'completed'; activities: { id: string; name: string; minutes: number; minimum: number }[] }[] }
export interface CompanionChangeRequest { projectId: string; revision: number; actions: CompanionEdit[]; undo?: boolean; done: (result: { ok: boolean; message: string; revision?: number }) => void }

/** Returns an atomic edit; persistence, existing method rules and undo remain owned by the workspace. */
export function applyCompanionEdits(project: Project, expectedRevision: number, input: unknown): Project {
  if (project.revision !== expectedRevision) throw new Error('Your plan changed while the companion was replying. Ask again using the current plan.');
  const actions = z.array(companionEditSchema).min(1).max(12).parse(input);
  let next = structuredClone(project);
  for (const action of actions) {
    const session = next.sessions.find(s => s.id === action.sessionId);
    if (!session || session.status === 'completed') throw new Error('Choose an unfinished session.');
    if (action.kind === 'session_duration') {
      if (action.minutes < 10) throw new Error('Allow at least 10 minutes for a session.');
      session.intake = { ...session.intake, minutes: action.minutes };
      if (session.plan) session.plan.intake = { ...session.plan.intake, minutes: action.minutes };
    } else {
      const activity = session.plan?.activities.find(a => a.instanceId === action.activityId);
      if (!activity) throw new Error('That activity is no longer in this session.');
      const floor = Math.max(activity.steps.length, activity.operational ? 1 : minimum(activity));
      if (action.minutes < floor) throw new Error(`${activity.name} needs at least ${floor} minutes.`);
      const durations = allocate(action.minutes, activity.steps.map(step => step.minutes));
      activity.steps = activity.steps.map((step, i) => ({ ...step, minutes: durations[i] }));
    }
    session.status = 'draft';
    if (session.plan) { session.plan.version++; session.plan.acceptedWarnings = []; }
  }
  return next;
}
