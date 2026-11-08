import { env } from 'cloudflare:workers';
import type { Board, BoardComment, BoardItem, BoardSection, BoardSession, BoardTemplate } from './board';
import { boardIdPattern, boardSections, documentTypes, limits, photoTypes } from './board';
import { HttpError } from './server-access';
import type { TemplateData } from './templates';
import { templateFor } from './templates';
import type { Activity, Intake } from './types';
// The board.plan column holds the mirrored project: { projectId, sessions }. Boards made before the
// planner had sessions hold { intake, activities }; they are read as one session.
type Stored = { projectId?: string; sessions?: BoardSession[]; intake?: Intake; activities?: Activity[] };
type ItemRow = { id: string; section_id: string; kind: 'photo' | 'note' | 'file'; file_name: string | null; text: string; author: string; width: number | null; height: number | null; created_at: string; deleted_at: string | null; object_key: string | null; content_type: string | null };
export class BoardError extends Error { constructor(message: string, public status = 400) { super(message); } }
function database() { if (!env.DB) throw new BoardError('The session board is temporarily unavailable.', 503); return env.DB; }
function bucket() { if (!env.BUCKET) throw new BoardError('Photo storage is not configured for this site.', 503); return env.BUCKET; }
function newBoardId() { const bytes = crypto.getRandomValues(new Uint8Array(16)); return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
// A project's workspace; its sessions are mirrored in afterwards with syncProject.
export async function createBoard(projectId: string, name: string) {
 const id = newBoardId();
 await database().prepare("INSERT INTO board (id,name,context,sections,plan_id,plan,created_at) VALUES (?,?,'',?,?,?,?)").bind(id, name, JSON.stringify(boardSections([])), projectId, JSON.stringify({ projectId, sessions: [] }), new Date().toISOString()).run();
 return id;
}
// Mirror the planner project into its board. Blocks keep their instanceId when moved or reordered,
// so their frames, uploads and templates follow them. Uploads in blocks that no longer exist move
// to General; templates are never deleted (a later agenda may bring the block back).
export async function syncProject(boardId: string, project: { projectId: string; name: string; description: string; sessions: BoardSession[] }) {
 const board = await readBoard(boardId);
 if (board.projectId && board.projectId !== project.projectId) throw new BoardError('This workspace belongs to a different project.', 409);
 const sections = boardSections(project.sessions); const keep = new Set(sections.map(s => s.id));
 // D1 rows are limited to about 2 MB; full agendas take roughly 15 KB per session.
 const mirrored = JSON.stringify({ projectId: project.projectId, sessions: project.sessions });
 if (mirrored.length > 1_800_000) throw new BoardError('This programme is too large to mirror into one workspace. Remove unused sessions or split the goals into separate projects.', 413);
 const db = database();
 // Find orphaned sections in code: programmes can have hundreds of blocks, more than D1 allows as bound parameters.
 const used = await db.prepare('SELECT DISTINCT section_id FROM board_item WHERE board_id=?').bind(boardId).all<{ section_id: string }>();
 const orphaned = used.results.map(r => r.section_id).filter(id => !keep.has(id));
 await db.batch([
  db.prepare('UPDATE board SET name=?,context=?,sections=?,plan_id=?,plan=? WHERE id=?').bind(project.name, project.description, JSON.stringify(sections), project.projectId, mirrored, boardId),
  ...orphaned.map(id => db.prepare("UPDATE board_item SET section_id='general' WHERE board_id=? AND section_id=?").bind(boardId, id)),
 ]);
 return readBoard(boardId);
}
// Imported project copies get their own workspace: every item, comment, file and template is
// duplicated, so edits never reach the original board.
export async function copyBoard(sourceId: string, projectId: string) {
 const source = await readBoard(sourceId); const id = newBoardId(); const db = database();
 const sessions = source.sessions; const now = new Date().toISOString();
 const [items, templates] = await Promise.all([readItems(sourceId), readTemplates(sourceId)]);
 await db.prepare('INSERT INTO board (id,name,context,sections,plan_id,plan,created_at) VALUES (?,?,?,?,?,?,?)').bind(id, source.name, source.context, JSON.stringify(source.sections), projectId, JSON.stringify({ projectId, sessions }), now).run();
 const statements: D1PreparedStatement[] = [];
 for (const item of items) {
  const row = await itemRow(sourceId, item.id); const newId = crypto.randomUUID(); let objectKey: string | null = null;
  if (row.object_key) { const object = await bucket().get(row.object_key); if (object) { objectKey = `boards/${id}/${newId}`; await bucket().put(objectKey, object.body, { httpMetadata: { contentType: row.content_type ?? undefined } }); } }
  statements.push(db.prepare('INSERT INTO board_item (id,board_id,section_id,kind,object_key,content_type,text,author,width,height,file_name,created_at,deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(newId, id, row.section_id, row.kind, objectKey, row.content_type, row.text, row.author, row.width, row.height, row.file_name, row.created_at, row.deleted_at));
  for (const c of item.comments) statements.push(db.prepare('INSERT INTO board_comment (id,item_id,board_id,author,body,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), newId, id, c.author, c.body, c.createdAt));
 }
 for (const t of templates) statements.push(db.prepare('INSERT INTO board_template (board_id,section_id,mode,data,updated_at,completed_at) VALUES (?,?,?,?,?,?)').bind(id, t.sectionId, t.mode, JSON.stringify(t.data), t.updatedAt, t.completedAt));
 if (statements.length) await db.batch(statements);
 return id;
}
export async function readBoard(id: string): Promise<Board> {
 if (!boardIdPattern.test(id)) throw new BoardError('This board link is not valid.', 404);
 const row = await database().prepare('SELECT id,name,context,sections,plan,plan_id,current_section,started_at,created_at FROM board WHERE id=?').bind(id).first<{ id: string; name: string; context: string; sections: string; plan: string | null; plan_id: string; current_section: string | null; started_at: string | null; created_at: string }>();
 if (!row) throw new BoardError('This board could not be found. Check the link or QR code.', 404);
 const stored: Stored = row.plan ? JSON.parse(row.plan) : {};
 const sessions: BoardSession[] = stored.sessions ?? (stored.activities?.length && stored.intake ? [{ id: 'legacy', title: 'Session', status: 'approved', intake: stored.intake, activities: stored.activities }] : []);
 return { id: row.id, name: row.name, context: row.context, projectId: stored.projectId ?? null, sessions, sections: JSON.parse(row.sections), createdAt: row.created_at, activities: sessions.flatMap(s => s.activities), currentSectionId: row.current_section, startedAt: row.started_at };
}
const toItem = (r: ItemRow, comments: BoardComment[]): BoardItem => ({ id: r.id, sectionId: r.section_id, kind: r.kind, text: r.text, author: r.author, width: r.width, height: r.height, fileName: r.file_name, createdAt: r.created_at, deletedAt: r.deleted_at, comments });
export async function readItems(boardId: string): Promise<BoardItem[]> {
 const db = database();
 const [items, comments] = await db.batch([
  db.prepare('SELECT * FROM board_item WHERE board_id=? ORDER BY created_at').bind(boardId),
  db.prepare('SELECT id,item_id,author,body,created_at FROM board_comment WHERE board_id=? ORDER BY created_at').bind(boardId),
 ]);
 const byItem = new Map<string, BoardComment[]>();
 for (const c of comments.results as { id: string; item_id: string; author: string; body: string; created_at: string }[]) byItem.set(c.item_id, [...(byItem.get(c.item_id) ?? []), { id: c.id, author: c.author, body: c.body, createdAt: c.created_at }]);
 return (items.results as ItemRow[]).map(r => toItem(r, byItem.get(r.id) ?? []));
}
async function itemRow(boardId: string, itemId: string) {
 const row = await database().prepare('SELECT * FROM board_item WHERE board_id=? AND id=?').bind(boardId, itemId).first<ItemRow>();
 if (!row) throw new BoardError('This item no longer exists.', 404);
 return row;
}
export async function addItem(boardId: string, input: { sectionId: string; kind: 'photo' | 'note' | 'file'; text: string; author: string; file?: File; width?: number; height?: number }) {
 const board = await readBoard(boardId);
 if (!board.sections.some(s => s.id === input.sectionId)) throw new BoardError('Choose one of the session sections.');
 const db = database();
 const count = await db.prepare('SELECT COUNT(*) AS n FROM board_item WHERE board_id=?').bind(boardId).first<{ n: number }>();
 if ((count?.n ?? 0) >= limits.itemsPerBoard) throw new BoardError('This board is full.');
 const id = crypto.randomUUID(); let objectKey: string | null = null, contentType: string | null = null, fileName: string | null = null;
 if (input.kind === 'photo') {
  const file = input.file;
  if (!file || !photoTypes.includes(file.type)) throw new BoardError('Upload a JPEG, PNG, WebP or GIF photo.');
  if (file.size > limits.photoBytes) throw new BoardError('This photo is too large. The limit is 12 MB.');
  objectKey = `boards/${boardId}/${id}`; contentType = file.type;
  await bucket().put(objectKey, file.stream(), { httpMetadata: { contentType } });
 } else if (input.kind === 'file') {
  const file = input.file;
  if (!file || !documentTypes.includes(file.type)) throw new BoardError('Upload a PDF document.');
  if (file.size > limits.fileBytes) throw new BoardError('This file is too large. The limit is 20 MB.');
  objectKey = `boards/${boardId}/${id}`; contentType = file.type; fileName = (file.name || 'document.pdf').slice(0, 200);
  await bucket().put(objectKey, file.stream(), { httpMetadata: { contentType } });
 } else if (!input.text.trim()) throw new BoardError('Write a note before sending it.');
 const createdAt = new Date().toISOString();
 const size = (n?: number) => n && Number.isFinite(n) && n > 0 ? Math.round(Math.min(n, 20000)) : null;
 await db.prepare('INSERT INTO board_item (id,board_id,section_id,kind,object_key,content_type,text,author,width,height,file_name,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
  .bind(id, boardId, input.sectionId, input.kind, objectKey, contentType, input.text.trim(), input.author.trim(), size(input.width), size(input.height), fileName, createdAt).run();
 return { id, sectionId: input.sectionId };
}
// Removal is soft so anyone can restore an item deleted by mistake.
export async function setRemoved(boardId: string, itemId: string, removed: boolean) {
 await itemRow(boardId, itemId);
 await database().prepare('UPDATE board_item SET deleted_at=? WHERE board_id=? AND id=?').bind(removed ? new Date().toISOString() : null, boardId, itemId).run();
}
export async function addComment(boardId: string, itemId: string, author: string, body: string): Promise<BoardComment> {
 const row = await itemRow(boardId, itemId);
 if (row.deleted_at) throw new BoardError('Restore this item before commenting on it.');
 const comment = { id: crypto.randomUUID(), author: author.trim(), body: body.trim(), createdAt: new Date().toISOString() };
 await database().prepare('INSERT INTO board_comment (id,item_id,board_id,author,body,created_at) VALUES (?,?,?,?,?,?)').bind(comment.id, itemId, boardId, comment.author, comment.body, comment.createdAt).run();
 return comment;
}
export async function readFile(boardId: string, itemId: string) {
 if (!boardIdPattern.test(boardId)) throw new BoardError('Not found.', 404);
 const row = await itemRow(boardId, itemId);
 if (!row.object_key) throw new BoardError('This item has no file.', 404);
 const object = await bucket().get(row.object_key);
 if (!object) throw new BoardError('The file is missing from storage.', 404);
 return { body: object.body, contentType: row.content_type ?? 'application/octet-stream', fileName: row.file_name };
}
// The facilitator's position in the agenda; phones default their uploads to it.
export async function setCurrentSection(boardId: string, sectionId: string | null) {
 const board = await readBoard(boardId);
 if (sectionId !== null && !board.sections.some(s => s.id === sectionId)) throw new BoardError('This step is not part of the session.');
 const started = sectionId !== null && board.activities.some(a => a.instanceId === sectionId);
 await database().prepare('UPDATE board SET current_section=?, started_at=CASE WHEN started_at IS NULL AND ? THEN ? ELSE started_at END WHERE id=?').bind(sectionId, started ? 1 : 0, new Date().toISOString(), boardId).run();
}
export async function readTemplates(boardId: string): Promise<BoardTemplate[]> {
 const result = await database().prepare('SELECT section_id,mode,data,updated_at,completed_at FROM board_template WHERE board_id=?').bind(boardId).all<{ section_id: string; mode: 'digital' | 'manual'; data: string; updated_at: string; completed_at: string | null }>();
 return result.results.map(r => ({ sectionId: r.section_id, mode: r.mode, data: JSON.parse(r.data), updatedAt: r.updated_at, completedAt: r.completed_at }));
}
export async function saveTemplate(boardId: string, sectionId: string, input: { mode: 'digital' | 'manual'; data: TemplateData; completed: boolean }): Promise<BoardTemplate> {
 const board = await readBoard(boardId);
 const activity = board.activities.find(a => a.instanceId === sectionId);
 if (!activity || !templateFor(activity)) throw new BoardError('This step has no method template.');
 const data = JSON.stringify(input.data);
 if (data.length > limits.templateChars) throw new BoardError('This template is too long to save.');
 const now = new Date().toISOString();
 await database().prepare('INSERT INTO board_template (board_id,section_id,mode,data,updated_at,completed_at) VALUES (?,?,?,?,?,?) ON CONFLICT(board_id,section_id) DO UPDATE SET mode=excluded.mode,data=excluded.data,updated_at=excluded.updated_at,completed_at=CASE WHEN ? THEN COALESCE(board_template.completed_at,excluded.updated_at) ELSE NULL END')
  .bind(boardId, sectionId, input.mode, data, now, input.completed ? now : null, input.completed ? 1 : 0).run();
 const saved = (await readTemplates(boardId)).find(t => t.sectionId === sectionId);
 if (!saved) throw new BoardError('The template could not be saved.', 500);
 return saved;
}
export function boardErrorResponse(e: unknown, fallback: string) {
 if (e instanceof BoardError || e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status, headers: { 'Cache-Control': 'no-store' } });
 console.error('board', e);
 return Response.json({ error: fallback }, { status: 500 });
}
