import { it } from 'node:test';
import assert from 'node:assert/strict';
import { allSourceMethods, sourceMethods, withDemoRatings, withFacilitatorEstimates } from '../lib/catalogue';
import { generatePlan } from '../lib/engine';
import { blankProject, moveBlock, newSession, projectSchema, validateProjectChange } from '../lib/projects';
import { createLocalProject, exportProject, importProject, importProjectFile } from '../lib/local-projects';
import { boardSections } from '../lib/board';
import { templateFor } from '../lib/templates';
const catalogue = withFacilitatorEstimates(withDemoRatings(allSourceMethods));
const boardId = 'AbCdEfGhIjKlMnOpQrStUv';
function planned(name = 'Workspace') { const p = createLocalProject(blankProject(name)); p.demo = true; p.sessions[0].plan = generatePlan(p.sessions[0].intake, withDemoRatings(sourceMethods), true); return p; }

it('new and older projects start without a workspace link', () => {
 const p = blankProject('New'); assert.equal(p.workspace, null); assert.equal(p.workspaceCopyFrom, null);
 // Backups written before the workspace existed have neither field.
 const older = JSON.parse(exportProject(createLocalProject(blankProject('Older')))); delete older.project.workspace; delete older.project.workspaceCopyFrom;
 const imported = importProject(JSON.stringify(older)); assert.equal(imported.workspace, null); assert.equal(imported.workspaceCopyFrom, null);
});
it('importing a copy never links back to the original workspace', () => {
 const original = { ...planned(), workspace: { boardId } };
 const copy = importProject(exportProject(original));
 assert.notEqual(copy.id, original.id); assert.equal(copy.workspace, null); assert.equal(copy.workspaceCopyFrom, boardId);
 // Browser backups behave the same for every project in them.
 const restored = importProjectFile(JSON.stringify({ version: 1, projects: [original] }));
 assert.equal(restored[0].workspace, null); assert.equal(restored[0].workspaceCopyFrom, boardId);
});
it('workspace links are validated', () => {
 assert.throws(() => projectSchema.parse({ ...blankProject('Bad'), workspace: { boardId: '../other' } }));
});
it('workspace frames follow blocks across reordering and moves between sessions', () => {
 const p = planned(); const a = p.sessions[0]; const b = { ...newSession('Second'), plan: null };
 const before = new Set(boardSections([{ ...a, activities: a.plan!.activities }]).map(s => s.id));
 const block = a.plan!.activities[1];
 const reordered = moveBlock([a, b], a.id, block.instanceId, a.id, a.plan!.activities.length);
 const moved = moveBlock(reordered, a.id, block.instanceId, b.id, 0);
 const after = boardSections(moved.map(s => ({ ...s, activities: s.plan?.activities ?? [] })));
 assert.deepEqual(new Set(after.map(s => s.id)), before);
 assert.equal(after.find(s => s.id === block.instanceId)!.sessionId, b.id);
});
it('completion records keep a fixed workspace summary that later edits cannot change', () => {
 const p = planned(); const summary = { boardId, capturedAt: '2026-10-16T10:00:00.000Z', items: 3, summary: '## Braindrawing\n\n- Note: Handle folds into the lid' };
 const done = { ...p, sessions: [{ ...p.sessions[0], status: 'completed' as const, completion: { outcomes: 'Ideas', decisions: '', questions: '', completedAt: 'now', workspace: summary } }] };
 validateProjectChange(p, done, catalogue, true);
 const edited = { ...done, sessions: [{ ...done.sessions[0], completion: { ...done.sessions[0].completion, workspace: { ...summary, items: 9 } } }] };
 assert.throws(() => validateProjectChange(done, edited, catalogue), /Completed sessions/);
 // Survives export and import.
 const copy = importProject(exportProject({ ...done, id: p.id, revision: 1, updatedAt: 'now' }));
 assert.deepEqual(copy.sessions[0].completion?.workspace, summary);
});
it('every method block in a generated agenda has a fill-in template; session steps do not', () => {
 const p = planned();
 for (const a of p.sessions[0].plan!.activities) assert.equal(!!templateFor(a), !a.operational);
});
