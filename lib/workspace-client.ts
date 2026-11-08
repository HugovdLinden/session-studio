// Connects a browser-local planner project to its online workspace (board). The planner stays the
// source of truth for sessions and agendas; the workspace mirrors them so uploads, comments and
// method templates attach to stable block IDs.
import type { Board, BoardItem, BoardTemplate } from './board';
import { request, json } from './board-client';
import type { Project, Session } from './projects';
import { templateFor, templateToMarkdown } from './templates';

// Sessions are sent in goal order; with several goals each title names its goal ("Goal · Session 2").
function payload(p: Project) {
 const goals = p.goals ?? []; const order = goals.flatMap(g => g.sessionIds); const goalOf = new Map(goals.flatMap(g => g.sessionIds.map(id => [id, g.title] as const)));
 const sessions = [...p.sessions].sort((a, b) => (order.indexOf(a.id) + 1 || 1e9) - (order.indexOf(b.id) + 1 || 1e9));
 return { projectId: p.id, name: p.name, description: p.description, sessions: sessions.map(s => ({ id: s.id, title: (goals.length > 1 ? `${goalOf.get(s.id) ?? ''} · ${s.title}` : s.title).slice(0, 160), status: s.status, intake: s.intake, plan: s.plan })) };
}
export async function syncWorkspace(boardId: string, project: Project) { return (await request<{ board: Board }>(`/api/boards/${boardId}/project`, json('PUT', payload(project)))).board; }

// Returns the board id, creating the workspace (or the imported copy) on first use. The caller saves
// { workspace: { boardId }, workspaceCopyFrom: null } into the project.
export async function ensureWorkspace(project: Project): Promise<string> {
 let id = project.workspace?.boardId;
 if (!id && project.workspaceCopyFrom) id = (await request<{ id: string }>(`/api/boards/${project.workspaceCopyFrom}/copy`, json('POST', { projectId: project.id }))).id;
 if (!id) id = (await request<{ id: string }>('/api/boards', json('POST', { projectId: project.id, name: project.name }))).id;
 await syncWorkspace(id, project);
 return id;
}

// A plain-text record of one session's workspace content, stored in its completion record.
export async function workspaceSummary(boardId: string, session: Session) {
 const d = await request<{ board: Board; items: BoardItem[]; templates: BoardTemplate[] }>(`/api/boards/${boardId}`);
 const blocks = session.plan?.activities ?? []; const live = d.items.filter(i => !i.deletedAt);
 const lines: string[] = []; let count = 0;
 for (const a of blocks) {
  const items = live.filter(i => i.sectionId === a.instanceId); count += items.length;
  const t = templateFor(a); const saved = d.templates.find(x => x.sectionId === a.instanceId);
  if (!items.length && !saved) continue;
  lines.push(`## ${a.name}`, `${items.filter(i => i.kind === 'photo').length} photos · ${items.filter(i => i.kind === 'note').length} notes · ${items.filter(i => i.kind === 'file').length} PDFs`);
  for (const n of items.filter(i => i.kind === 'note')) lines.push(`- Note (${n.author || 'Anonymous'}): ${n.text}`);
  if (t && saved) lines.push(saved.mode === 'manual' ? `${t.title}: done on paper (see photos).` : templateToMarkdown(t, saved.data, '###'));
 }
 const summary = lines.join('\n\n') || 'Nothing was added to the workspace for this session.';
 return { boardId, capturedAt: new Date().toISOString(), items: count, summary: summary.length > 20000 ? `${summary.slice(0, 19950)}\n\n[Shortened. The full content is in the workspace.]` : summary };
}
