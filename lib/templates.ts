// Fill-in templates for the executable methods. They are facilitator worksheets built from each
// method's adapted steps (lib/catalogue.ts), not reproductions of the source book's pages.
import type { Activity } from './types';

type Ref = { field: string; column?: string };
export type TemplateField =
 | { id: string; label: string; kind: 'text'; hint?: string; placeholder?: string }
 | { id: string; label: string; kind: 'longtext'; hint?: string; placeholder?: string }
 | { id: string; label: string; kind: 'list'; hint?: string; placeholder?: string }
 | { id: string; label: string; kind: 'table'; hint?: string; columns: { id: string; label: string; options?: string[] }[] }
 | { id: string; label: string; kind: 'grid'; hint?: string; rows: Ref; columns: Ref; options?: string[]; numeric?: { min: number; max: number }; weights?: Ref };
export interface MethodTemplate { title: string; intro: string; fields: TemplateField[] }
export type TemplateValue = string | string[] | Record<string, string>[] | Record<string, string>;
export type TemplateData = Record<string, TemplateValue>;

const scale = ['−−', '−', '+', '++'];
const templates: Record<string, MethodTemplate> = {
 'delft-how-tos': { title: 'How-Tos worksheet', intro: 'Reframe the problem as several How-To questions before generating answers.', fields: [
  { id: 'problem', label: 'Problem statement', kind: 'longtext' },
  { id: 'stakeholders', label: 'Stakeholders and aspects', kind: 'list', hint: 'People involved and relevant life phases of the product or service.' },
  { id: 'questions', label: 'How-To questions', kind: 'table', columns: [{ id: 'question', label: 'How to …' }, { id: 'perspective', label: 'Perspective / stakeholder' }] },
  { id: 'frames', label: 'Chosen frames', kind: 'list', hint: 'Themes or questions that keep stakeholder diversity.' },
  { id: 'ideas', label: 'Ideas', kind: 'table', columns: [{ id: 'idea', label: 'Idea' }, { id: 'question', label: 'Answers which How-To' }] },
 ] },
 'delft-braindrawing': { title: 'Braindrawing record', intro: 'Record the target, the sketch rounds and the ideas chosen for development.', fields: [
  { id: 'target', label: 'Challenge or target', kind: 'longtext' },
  { id: 'rules', label: 'Agreed divergent rules', kind: 'list' },
  { id: 'sketches', label: 'Sketches', kind: 'table', hint: 'Photograph the sheets with the step’s QR code; give each a title here.', columns: [{ id: 'title', label: 'Title' }, { id: 'explanation', label: 'Explanation' }, { id: 'contributors', label: 'Contributors' }] },
  { id: 'criteria', label: 'Selection criteria', kind: 'list' },
  { id: 'selected', label: 'Selected ideas', kind: 'list' },
 ] },
 'delft-morphological-chart': { title: 'Morphological chart', intro: 'Decompose the main function, list options per sub-function and combine them into concepts.', fields: [
  { id: 'function', label: 'Main function', kind: 'text' },
  { id: 'requirements', label: 'Design requirements', kind: 'list' },
  { id: 'chart', label: 'Sub-functions and options', kind: 'table', columns: [{ id: 'subfunction', label: 'Sub-function' }, { id: 'a', label: 'Option A' }, { id: 'b', label: 'Option B' }, { id: 'c', label: 'Option C' }, { id: 'd', label: 'Option D' }] },
  { id: 'combinations', label: 'Combinations', kind: 'table', columns: [{ id: 'name', label: 'Concept' }, { id: 'options', label: 'Options chosen' }, { id: 'assessment', label: 'Assessment against requirements' }] },
  { id: 'selected', label: 'Principal solutions to develop', kind: 'list', hint: 'Choose at least three.' },
 ] },
 'delft-scamper': { title: 'SCAMPER sheet', intro: 'Transform the starting idea with each of the seven prompts. Capture variations without judging them.', fields: [
  { id: 'start', label: 'Starting idea, concept or product', kind: 'longtext' },
  ...([['substitute', 'Substitute'], ['combine', 'Combine'], ['adapt', 'Adapt'], ['modify', 'Modify'], ['other-use', 'Put to another use'], ['eliminate', 'Eliminate'], ['reverse', 'Reverse']] as const).map(([id, label]) => ({ id, label, kind: 'list' as const })),
  { id: 'directions', label: 'Selected directions', kind: 'list' },
 ] },
 'delft-c-box': { title: 'C-Box', intro: 'Place each idea on novelty and feasibility, then reflect on the map.', fields: [
  { id: 'novelty', label: 'What “novel” means for this project', kind: 'text' },
  { id: 'feasibility', label: 'What “feasible” means for this project', kind: 'text' },
  { id: 'ideas', label: 'Ideas', kind: 'table', columns: [{ id: 'idea', label: 'Idea' }, { id: 'novelty', label: 'Novelty', options: ['Low', 'High'] }, { id: 'feasibility', label: 'Feasibility', options: ['Low', 'High'] }] },
  { id: 'reflection', label: 'Gaps and reflections', kind: 'longtext' },
  { id: 'next', label: 'Next direction', kind: 'longtext' },
 ] },
 'delft-harris-profile': { title: 'Harris profile', intro: 'Rate every concept on a four-position scale per requirement and compare the profiles.', fields: [
  { id: 'requirements', label: 'Requirements (in priority order)', kind: 'list' },
  { id: 'concepts', label: 'Concepts', kind: 'list' },
  { id: 'scale', label: 'Agreed meaning of the scale (−− − + ++)', kind: 'longtext' },
  { id: 'profile', label: 'Profiles', kind: 'grid', rows: { field: 'requirements' }, columns: { field: 'concepts' }, options: scale },
  { id: 'discussion', label: 'Discussion and implications', kind: 'longtext' },
 ] },
 'delft-datum': { title: 'Datum matrix', intro: 'Compare alternatives against a reference concept, criterion by criterion.', fields: [
  { id: 'datum', label: 'Datum (reference concept)', kind: 'text' },
  { id: 'criteria', label: 'Criteria', kind: 'list' },
  { id: 'alternatives', label: 'Alternatives', kind: 'list' },
  { id: 'matrix', label: 'Compared with the datum', kind: 'grid', rows: { field: 'criteria' }, columns: { field: 'alternatives' }, options: ['Worse', 'Same', 'Better'] },
  { id: 'discussion', label: 'Strengths and weaknesses', kind: 'longtext' },
  { id: 'next', label: 'Next datum or decision', kind: 'longtext' },
 ] },
 'delft-weighted-objectives': { title: 'Weighted objectives', intro: 'Make criteria and their importance explicit, score each concept and discuss the totals.', fields: [
  { id: 'criteria', label: 'Criteria and weights', kind: 'table', hint: 'Weights are relative, e.g. percentages that add up to 100.', columns: [{ id: 'criterion', label: 'Criterion' }, { id: 'weight', label: 'Weight' }, { id: 'anchors', label: 'Scoring anchors' }] },
  { id: 'concepts', label: 'Concepts', kind: 'list' },
  { id: 'scores', label: 'Scores (0–10)', kind: 'grid', rows: { field: 'criteria', column: 'criterion' }, columns: { field: 'concepts' }, numeric: { min: 0, max: 10 }, weights: { field: 'criteria', column: 'weight' } },
  { id: 'discussion', label: 'Discussion and review', kind: 'longtext', hint: 'Small differences may not be meaningful.' },
 ] },
};

// Methods without a dedicated worksheet record the outcome of each of their steps.
function generic(activity: Pick<Activity, 'name' | 'steps'>): MethodTemplate {
 return { title: `${activity.name} record`, intro: 'Record the outcome of each step.', fields: [...activity.steps.map((s, i) => ({ id: `step-${i + 1}`, label: `${i + 1}. ${s.title}`, kind: 'longtext' as const, hint: s.summary })), { id: 'output', label: 'Output of this method', kind: 'longtext' }] };
}
export function templateFor(activity: Pick<Activity, 'methodId' | 'name' | 'steps' | 'operational'>): MethodTemplate | null {
 if (activity.operational) return null;
 return templates[activity.methodId] ?? generic(activity);
}

export const cellKey = (row: string, column: string) => JSON.stringify([row, column]);
export function labels(ref: Ref, data: TemplateData): string[] {
 const value = data[ref.field];
 if (!Array.isArray(value)) return [];
 const list = value.map(v => typeof v === 'string' ? v : v[ref.column ?? ''] ?? '');
 return [...new Set(list.map(v => v.trim()).filter(Boolean))];
}
export function weightedTotals(field: Extract<TemplateField, { kind: 'grid' }>, data: TemplateData) {
 if (!field.weights) return null;
 const rows = Array.isArray(data[field.rows.field]) ? data[field.rows.field] as Record<string, string>[] : [];
 const grid = (data[field.id] ?? {}) as Record<string, string>;
 return labels(field.columns, data).map(column => rows.reduce((sum, row) => {
  const label = (row[field.rows.column ?? ''] ?? '').trim(); const weight = Number(row[field.weights!.column ?? '']); const score = Number(grid[cellKey(label, column)]);
  return label && Number.isFinite(weight) && Number.isFinite(score) ? sum + weight * score : sum;
 }, 0));
}
export function hasContent(data: TemplateData) {
 return Object.values(data).some(v => typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.some(x => typeof x === 'string' ? x.trim() : Object.values(x).some(c => c.trim())) : Object.values(v).some(c => c.trim()));
}

const rowsOf = (v: TemplateValue | undefined) => Array.isArray(v) ? v.filter(r => typeof r !== 'string' && Object.values(r).some(c => c.trim())) as Record<string, string>[] : [];
const itemsOf = (v: TemplateValue | undefined) => Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && x.trim()) : [];
// Plain-text table cells: Markdown pipes and line breaks would break the table.
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
export function templateToMarkdown(template: MethodTemplate, data: TemplateData, heading = '###') {
 const parts = [`${heading} ${template.title}`];
 for (const f of template.fields) {
  const v = data[f.id]; let body = '';
  if (f.kind === 'text' || f.kind === 'longtext') body = typeof v === 'string' ? v.trim() : '';
  else if (f.kind === 'list') body = itemsOf(v).map(x => `- ${x}`).join('\n');
  else if (f.kind === 'table') { const rows = rowsOf(v); if (rows.length) body = [`| ${f.columns.map(c => cell(c.label)).join(' | ')} |`, `|${f.columns.map(() => ' --- |').join('')}`, ...rows.map(r => `| ${f.columns.map(c => cell(r[c.id] ?? '')).join(' | ')} |`)].join('\n'); }
  else if (f.kind === 'grid') { const rows = labels(f.rows, data), cols = labels(f.columns, data), grid = (v ?? {}) as Record<string, string>; const totals = weightedTotals(f, data);
   if (rows.length && cols.length) body = [`| | ${cols.map(cell).join(' | ')} |`, `|---|${cols.map(() => ' --- |').join('')}`, ...rows.map(r => `| ${cell(r)} | ${cols.map(c => cell(grid[cellKey(r, c)] ?? '')).join(' | ')} |`), ...(totals ? [`| **Weighted total** | ${totals.map(t => `**${Math.round(t * 100) / 100}**`).join(' | ')} |`] : [])].join('\n'); }
  parts.push(`**${f.label}**\n\n${body || '_Not filled in._'}`);
 }
 return parts.join('\n\n');
}
