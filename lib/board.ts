import type { Activity, Category, Intake } from './types';
import type { TemplateData } from './templates';
// Shared by the project workspace (board), the session runner, the phone upload page and the board API.
// A board belongs to one browser-local planner project. It mirrors that project's sessions so each
// agenda block (stable Activity.instanceId) has a frame; the planner itself stays the source of truth.
export interface BoardSession { id: string; title: string; status: 'draft' | 'approved' | 'completed'; intake: Intake; activities: Activity[] }
export interface BoardSection { id: string; name: string; category: Category; index: number; sessionId?: string; sessionTitle?: string }
export interface Board { id: string; name: string; context: string; projectId: string | null; sessions: BoardSession[]; sections: BoardSection[]; createdAt: string; activities: Activity[]; currentSectionId: string | null; startedAt: string | null }
export interface BoardComment { id: string; author: string; body: string; createdAt: string }
export interface BoardItem { id: string; sectionId: string; kind: 'photo' | 'note' | 'file'; text: string; author: string; width: number | null; height: number | null; fileName: string | null; createdAt: string; deletedAt: string | null; comments: BoardComment[] }
export interface BoardTemplate { sectionId: string; mode: 'digital' | 'manual'; data: TemplateData; updatedAt: string; completedAt: string | null }
export const beforeSection = { id: 'before', name: 'Before the session', category: 'organisation' as const };
export const generalSection = { id: 'general', name: 'General', category: 'organisation' as const };
export const boardIdPattern = /^[A-Za-z0-9_-]{22}$/;
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const documentTypes = ['application/pdf'];
export const limits = { photoBytes: 12 * 1024 * 1024, fileBytes: 20 * 1024 * 1024, text: 2000, author: 60, comment: 1000, itemsPerBoard: 2000, templateChars: 100_000 };
export function boardSections(sessions: Pick<BoardSession, 'id' | 'title' | 'activities'>[]): BoardSection[] {
 const blocks = sessions.flatMap(s => s.activities.map(a => ({ id: a.instanceId, name: a.name, category: a.operational ? 'organisation' as const : a.category, sessionId: s.id, sessionTitle: s.title })));
 return [{ ...beforeSection, index: 0 }, ...blocks.map((b, i) => ({ ...b, index: i + 1 })), { ...generalSection, index: blocks.length + 1 }];
}
export const draftSections = (): BoardSection[] => boardSections([]);
export const fileUrl = (boardId: string, itemId: string) => `/api/boards/${boardId}/files/${itemId}`;
export const uploadPath = (boardId: string, sectionId?: string) => `/board/${boardId}/upload${sectionId ? `?section=${encodeURIComponent(sectionId)}` : ''}`;
// Planner links: the project page reads ?project= and ?session= to reopen the right place.
export const projectPath = (board: Pick<Board, 'projectId'>, sessionId?: string) => board.projectId ? `/?project=${encodeURIComponent(board.projectId)}${sessionId ? `&session=${encodeURIComponent(sessionId)}` : ''}` : '/';
export const runPath = (boardId: string, sessionId?: string) => `/board/${boardId}/run${sessionId ? `?session=${encodeURIComponent(sessionId)}` : ''}`;
export function timeLabel(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
export const sectionNumber = (s: Pick<BoardSection, 'index'>) => String(s.index).padStart(2, '0');
