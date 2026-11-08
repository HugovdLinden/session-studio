// Every download on the site is a PDF (plans, the board, templates) or a PNG (photos, QR codes).
// jsPDF is loaded on demand so it never weighs down the first page load.
import type { jsPDF as JsPDF } from 'jspdf';
import type { Board, BoardItem, BoardSection, BoardTemplate } from './board';
import { fileUrl, sectionNumber, timeLabel } from './board';
import { activityMinutes, totalMinutes } from './engine';
import type { MethodTemplate, TemplateData } from './templates';
import { cellKey, labels, templateFor, weightedTotals } from './templates';
import type { Activity, Plan } from './types';
import { goalLabels, levelLabels, phaseLabels } from './types';

type RGB = [number, number, number];
const ink: RGB = [23, 36, 58], muted: RGB = [84, 98, 119], accent: RGB = [36, 84, 214], line: RGB = [219, 225, 234];
// The built-in PDF fonts cover Windows-1252 only; swap the few other symbols the app uses.
const cp1252 = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const swaps: Record<string, string> = { '−': '-', '→': '->', '←': '<-', '↓': 'v', '×': 'x', '✓': 'v', '·': '·' };
const clean = (s: string) => Array.from(s.normalize('NFC')).map(c => swaps[c] ?? (c.charCodeAt(0) < 256 || cp1252.has(c) ? c : '?')).join('');
const safeName = (s: string) => s.replace(/[\\/:*?"<>|#%]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'session';
const categoryLabels = { diverging: 'Diverging', reverging: 'Reverging', converging: 'Converging', resting: 'Resting', organisation: 'Session step', unclassified: 'Not yet categorised' };

async function load() {
 const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
 return { jsPDF, autoTable };
}

class Writer {
 margin = 48; y = 48; width: number; height: number;
 constructor(public doc: JsPDF, private autoTable: Awaited<ReturnType<typeof load>>['autoTable']) { this.width = doc.internal.pageSize.getWidth() - this.margin * 2; this.height = doc.internal.pageSize.getHeight(); }
 ensure(h: number) { if (this.y + h > this.height - this.margin) { this.doc.addPage(); this.y = this.margin; } }
 text(s: string, o: { size?: number; bold?: boolean; color?: RGB; after?: number; indent?: number; width?: number } = {}) {
  const size = o.size ?? 10, lh = size * 1.4, indent = o.indent ?? 0;
  this.doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); this.doc.setFontSize(size); this.doc.setTextColor(...(o.color ?? ink));
  for (const l of this.doc.splitTextToSize(clean(s), o.width ?? this.width - indent) as string[]) { this.ensure(lh); this.doc.text(l, this.margin + indent, this.y + size); this.y += lh; }
  this.y += o.after ?? 4;
 }
 heading(s: string, size = 15) { this.ensure(size * 3); this.y += 6; this.text(s, { size, bold: true, after: 6 }); }
 rule() { this.ensure(12); this.doc.setDrawColor(...line); this.doc.line(this.margin, this.y, this.margin + this.width, this.y); this.y += 12; }
 table(head: string[], body: string[][], o: { widths?: (number | 'auto')[]; foot?: string[] } = {}) {
  this.autoTable(this.doc, { startY: this.y, head: [head.map(clean)], body: body.map(r => r.map(clean)), foot: o.foot ? [o.foot.map(clean)] : undefined, theme: 'grid', margin: { left: this.margin, right: this.margin },
   styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: ink, lineColor: line, lineWidth: .5, overflow: 'linebreak' },
   headStyles: { fillColor: [243, 246, 251], textColor: ink, fontStyle: 'bold' }, footStyles: { fillColor: [238, 243, 255], textColor: ink, fontStyle: 'bold' },
   columnStyles: Object.fromEntries((o.widths ?? []).map((w, i) => [i, { cellWidth: w }])) });
  this.y = (this.doc as JsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
 }
 box(s: string, fill: RGB) {
  const size = 10, lh = size * 1.4, pad = 10; this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(size);
  const lines = this.doc.splitTextToSize(clean(s), this.width - pad * 2) as string[]; const h = lines.length * lh + pad * 2;
  this.ensure(Math.min(h, 200)); this.doc.setFillColor(...fill); this.doc.setDrawColor(...line); this.doc.roundedRect(this.margin, this.y, this.width, Math.min(h, this.height - this.margin - this.y), 4, 4, 'FD');
  this.y += pad; this.doc.setTextColor(...ink); for (const l of lines) { this.ensure(lh); this.doc.text(l, this.margin + pad, this.y + size); this.y += lh; } this.y += pad + 6;
 }
 footer(title: string) {
  const n = this.doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { this.doc.setPage(i); this.doc.setFont('helvetica', 'normal'); this.doc.setFontSize(8); this.doc.setTextColor(...muted); this.doc.text(clean(`${title} · Session Studio`), this.margin, this.height - 24); this.doc.text(`Page ${i} of ${n}`, this.margin + this.width, this.height - 24, { align: 'right' }); }
 }
 save(name: string) { this.doc.save(`${safeName(name)}.pdf`); }
}
async function writer(title: string) { const { jsPDF, autoTable } = await load(); const doc = new jsPDF({ unit: 'pt', format: 'a4' }); doc.setProperties({ title: clean(title), creator: 'Session Studio' }); return new Writer(doc, autoTable); }

function writeTemplate(w: Writer, t: MethodTemplate, data: TemplateData) {
 w.text(t.title, { size: 12, bold: true, color: accent, after: 6 });
 for (const f of t.fields) {
  const v = data[f.id]; w.text(f.label, { bold: true, size: 10, after: 2 });
  if (f.kind === 'text' || f.kind === 'longtext') { const s = typeof v === 'string' ? v.trim() : ''; w.text(s || 'Not filled in.', { color: s ? ink : muted, after: 8 }); }
  else if (f.kind === 'list') { const items = Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && x.trim()) : []; if (items.length) { items.forEach(x => w.text(`•  ${x}`, { indent: 8, after: 1 })); w.y += 6; } else w.text('Not filled in.', { color: muted, after: 8 }); }
  else if (f.kind === 'table') { const rows = Array.isArray(v) ? (v as Record<string, string>[]).filter(r => typeof r === 'object' && Object.values(r).some(c => c?.trim())) : []; if (rows.length) w.table(f.columns.map(c => c.label), rows.map(r => f.columns.map(c => r[c.id] ?? ''))); else w.text('Not filled in.', { color: muted, after: 8 }); }
  else { const rows = labels(f.rows, data), cols = labels(f.columns, data), grid = (v ?? {}) as Record<string, string>, totals = weightedTotals(f, data);
   if (rows.length && cols.length) w.table(['', ...cols], rows.map(r => [r, ...cols.map(c => grid[cellKey(r, c)] ?? '')]), { foot: totals ? ['Weighted total', ...totals.map(t => String(Math.round(t * 100) / 100))] : undefined });
   else w.text('Not filled in.', { color: muted, after: 8 }); }
 }
}

export async function downloadPlanPdf(plan: Plan) {
 const w = await writer(`${plan.intake.name} — session plan`);
 w.text('Approved session plan', { size: 9, bold: true, color: accent, after: 2 }); w.text(plan.intake.name, { size: 22, bold: true, after: 4 });
 if (plan.intake.description) w.text(plan.intake.description, { color: muted, after: 4 });
 w.text(`${phaseLabels[plan.intake.phase]} · ${goalLabels[plan.intake.goal]} · ${plan.intake.participants} participants · ${levelLabels[plan.intake.level]} · ${totalMinutes(plan)} of ${plan.intake.minutes} minutes`, { color: muted, after: 4 });
 w.text(plan.demo ? 'Demo ratings: timings and difficulty are illustrative estimates.' : 'Planned with your saved library ratings.', { size: 9, color: muted, after: 2 });
 w.text('Rule-based planner; no paid AI calls.', { size: 9, color: muted, after: 8 });
 if (plan.acceptedWarnings.length) { w.text('Accepted planning constraints', { bold: true, after: 2 }); plan.acceptedWarnings.forEach(x => w.text(`•  ${x}`, { indent: 8, after: 1 })); w.y += 6; }
 w.table(['#', 'Block', 'Type', 'Time'], plan.activities.map((a, i) => { const start = plan.activities.slice(0, i).reduce((n, x) => n + activityMinutes(x), 0); return [String(i + 1), a.name, categoryLabels[a.operational ? 'organisation' : a.category], `${start}–${start + activityMinutes(a)} min`]; }), { widths: [28, 'auto', 110, 90] });
 let elapsed = 0;
 for (const a of plan.activities) { const start = elapsed; elapsed += activityMinutes(a); writeActivity(w, a, `${start}–${elapsed} min`); }
 w.footer(plan.intake.name); w.save(`${plan.intake.name} - session plan`);
}
function writeActivity(w: Writer, a: Activity, when: string) {
 w.rule(); w.heading(`${when} · ${a.name}`, 13); w.text(a.takeaway, { color: muted, after: 4 });
 if (a.input) w.text(`Start with: ${a.input}`, { size: 9, after: 1 }); if (a.materials) w.text(`Materials: ${a.materials}`, { size: 9, after: 6 });
 w.table(['#', 'Step', 'Min', 'What to do'], a.steps.map((s, i) => [String(i + 1), s.title, String(s.minutes), `${s.summary}\n${s.detail}`]), { widths: [24, 110, 32, 'auto'] });
 if (a.source) w.text(a.source, { size: 8, color: muted, after: 6 });
}

export async function downloadBlankTemplatePdf(t: MethodTemplate, stepName: string, sessionName: string) {
 const w = await writer(`${t.title} — blank`);
 w.text(`${sessionName} · ${stepName}`, { size: 9, color: muted, after: 2 }); w.text(t.title, { size: 20, bold: true, after: 4 }); w.text(t.intro, { color: muted, after: 12 });
 for (const f of t.fields) {
  // Keep each label on the same page as its writing space.
  w.ensure((f.hint ? 34 : 20) + (f.kind === 'text' ? 32 : f.kind === 'longtext' ? 94 : f.kind === 'list' ? 124 : 120));
  w.text(f.label, { bold: true, after: 2 }); if (f.hint) w.text(f.hint, { size: 8, color: muted, after: 2 });
  if (f.kind === 'text') { w.ensure(28); w.doc.setDrawColor(...muted); w.doc.line(w.margin, w.y + 20, w.margin + w.width, w.y + 20); w.y += 32; }
  else if (f.kind === 'longtext' || f.kind === 'list') { const h = f.kind === 'list' ? 110 : 80; w.ensure(h); w.doc.setDrawColor(...muted); w.doc.roundedRect(w.margin, w.y, w.width, h, 4, 4); if (f.kind === 'list') for (let i = 1; i < 5; i++) { w.doc.setDrawColor(...line); w.doc.line(w.margin + 8, w.y + i * 22, w.margin + w.width - 8, w.y + i * 22); } w.y += h + 14; }
  else if (f.kind === 'table') w.table(f.columns.map(c => c.options ? `${c.label} (${c.options.join(' / ')})` : c.label), Array.from({ length: 6 }, () => f.columns.map(() => '\n')));
  else { const rowsLabel = t.fields.find(x => x.id === f.rows.field)?.label ?? '', colsLabel = t.fields.find(x => x.id === f.columns.field)?.label ?? ''; w.table([`${rowsLabel} / ${colsLabel}`, '', '', '', ''], Array.from({ length: 5 }, () => ['\n', '', '', '', '']), { widths: [170, 'auto', 'auto', 'auto', 'auto'] }); if (f.options) w.text(`Use: ${f.options.join('   ')}`, { size: 8, color: muted, after: 8 }); }
 }
 w.footer(sessionName); w.save(`${sessionName} - ${stepName} - blank template`);
}

// Photos are re-encoded to a bounded JPEG so the PDF stays a sensible size.
async function photoData(boardId: string, item: BoardItem) {
 const blob = await (await fetch(fileUrl(boardId, item.id))).blob(); const bitmap = await createImageBitmap(blob);
 const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
 const g = canvas.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height); g.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
 return { data: canvas.toDataURL('image/jpeg', .85), width: canvas.width, height: canvas.height };
}

export async function downloadBoardPdf(board: Board, items: BoardItem[], templates: BoardTemplate[], onProgress?: (done: number, total: number) => void) {
 const w = await writer(`${board.name} — session documentation`); const live = items.filter(i => !i.deletedAt);
 const photos = live.filter(i => i.kind === 'photo'); let done = 0;
 const activities = new Map(board.activities.map(a => [a.instanceId, a]));
 // Block times count from the start of their own session.
 const starts = new Map<string, number>(); for (const s of board.sessions) { let t = 0; for (const a of s.activities) { starts.set(a.instanceId, t); t += activityMinutes(a); } }
 w.text('Project workspace', { size: 9, bold: true, color: accent, after: 2 }); w.text(board.name, { size: 22, bold: true, after: 4 });
 if (board.context) w.text(board.context, { color: muted, after: 4 });
 w.text([new Date(board.createdAt).toLocaleDateString(), `${board.sessions.length} ${board.sessions.length === 1 ? 'session' : 'sessions'}`, ...board.sessions.slice(0, 1).map(s => `${phaseLabels[s.intake.phase]} · ${goalLabels[s.intake.goal]} · ${s.intake.participants} participants`)].join(' · '), { color: muted, after: 10 });
 w.table(['#', 'Session', 'Section', 'Time', 'Items', 'Template'], board.sections.map(s => { const a = activities.get(s.id); const t = templates.find(x => x.sectionId === s.id); const start = starts.get(s.id) ?? 0;
  return [sectionNumber(s), s.sessionTitle ?? '', s.name, a ? `${start}–${start + activityMinutes(a)} min` : '', String(live.filter(i => i.sectionId === s.id).length), a && templateFor(a) ? t ? t.completedAt ? (t.mode === 'manual' ? 'Done on paper' : 'Complete') : 'In progress' : 'Not started' : '']; }));
 for (const s of board.sections) {
  const sectionItems = live.filter(i => i.sectionId === s.id); const a = activities.get(s.id); const template = a && templateFor(a); const saved = templates.find(x => x.sectionId === s.id);
  if (s.id === 'general' && !sectionItems.length) continue;
  // Sections flow on; one only starts a new page when too little room is left for its heading and first content.
  w.y += 18; w.ensure(sectionItems.length || (template && saved) ? 220 : 130); writeSectionHead(w, s, a, sectionItems.length);
  if (template && saved) { if (saved.mode === 'manual') w.text('The group worked on paper; see the photos below.', { color: muted, after: 8 }); else { writeTemplate(w, template, saved.data); w.y += 4; } }
  const sectionPhotos = sectionItems.filter(i => i.kind === 'photo');
  if (sectionPhotos.length) { w.ensure(240); w.text('Photos', { bold: true, size: 11, after: 6 }); await writePhotos(w, board.id, sectionPhotos, () => onProgress?.(++done, photos.length)); }
  const notes = sectionItems.filter(i => i.kind === 'note');
  if (notes.length) { w.ensure(90); w.text('Notes', { bold: true, size: 11, after: 6 }); for (const n of notes) { w.box(n.text, [255, 248, 214]); writeMeta(w, n); } }
  const files = sectionItems.filter(i => i.kind === 'file');
  if (files.length) { w.text('Documents', { bold: true, size: 11, after: 4 }); for (const f of files) { w.text(`${f.fileName ?? 'Document'}${f.text ? ` — ${f.text}` : ''}`, { after: 1 }); writeMeta(w, f); } w.text('Uploaded PDFs are kept on the board; download them there.', { size: 8, color: muted, after: 8 }); }
  if (!sectionItems.length && !(template && saved)) w.text('Nothing was added to this section.', { color: muted, after: 4 });
 }
 w.footer(board.name); w.save(`${board.name} - session documentation`);
}
function writeSectionHead(w: Writer, s: BoardSection, a: Activity | undefined, count: number) {
 w.text(`${sectionNumber(s)} · ${s.sessionTitle ? `${s.sessionTitle} · ` : ''}${categoryLabels[s.category]}`, { size: 9, bold: true, color: accent, after: 2 }); w.text(s.name, { size: 18, bold: true, after: 2 });
 w.text(`${a ? `${activityMinutes(a)} min · ` : ''}${count} ${count === 1 ? 'item' : 'items'}`, { size: 9, color: muted, after: 4 }); if (a?.takeaway) w.text(a.takeaway, { color: muted, after: 6 }); w.rule();
}
function writeMeta(w: Writer, i: BoardItem) {
 w.text(`${i.author || 'Anonymous'} · ${timeLabel(i.createdAt)}`, { size: 8, color: muted, after: i.comments.length ? 2 : 8 });
 for (const c of i.comments) w.text(`${c.author || 'Anonymous'}: ${c.body}`, { size: 8, indent: 10, after: 1 }); if (i.comments.length) w.y += 7;
}
// Two photos per row, each with its caption, author and comments underneath.
async function writePhotos(w: Writer, boardId: string, photos: BoardItem[], tick: () => void) {
 const gap = 16, colW = (w.width - gap) / 2;
 for (let i = 0; i < photos.length; i += 2) {
  const row = await Promise.all(photos.slice(i, i + 2).map(async p => { const img = await photoData(boardId, p); tick(); return { p, img, h: Math.min(colW * img.height / img.width, 300) }; }));
  const imgH = Math.max(...row.map(r => r.h)); w.ensure(imgH + 40); const top = w.y; let bottom = top;
  row.forEach((r, j) => {
   const x = w.margin + j * (colW + gap), drawW = r.h * r.img.width / r.img.height; w.doc.addImage(r.img.data, 'JPEG', x, top, drawW, r.h);
   w.y = top + r.h + 6; const save = w.margin; w.margin = x;
   if (r.p.text) w.text(r.p.text, { size: 9, width: colW, after: 1 });
   w.text(`${r.p.author || 'Anonymous'} · ${timeLabel(r.p.createdAt)}`, { size: 8, color: muted, width: colW, after: 1 });
   for (const c of r.p.comments) w.text(`${c.author || 'Anonymous'}: ${c.body}`, { size: 8, width: colW, after: 1 });
   w.margin = save; bottom = Math.max(bottom, w.y);
  });
  w.y = bottom + 12;
 }
}

// Single-file downloads.
export function saveBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function downloadPng(source: string, name: string) {
 const blob = await (await fetch(source)).blob(); const bitmap = await createImageBitmap(blob); const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
 canvas.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
 const png = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png')); if (!png) throw new Error('The image could not be converted.');
 saveBlob(png, `${safeName(name)}.png`);
}
export const downloadName = (...parts: string[]) => safeName(parts.filter(Boolean).join(' - '));
