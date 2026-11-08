import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { CompanionService,streamedAnswer } from '../scripts/companion/service.mjs';
import { readContext } from '../scripts/companion/context.mjs';
import { allowedRequest } from '../scripts/companion/plugin.mjs';
import {websiteGuideVersion} from '../scripts/companion/website-guide.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'studio-companion-test-'));
  t.after(async () => { if (!path.basename(root).startsWith('studio-companion-test-')) throw new Error('Unsafe cleanup'); await rm(root, { recursive: true, force: true }); });
  await mkdir(path.join(root, 'graduation-context')); return root;
}
const question = { message: 'Help me think about next steps.', context: { phase: 'discover', goal: 'Understand the problem', hasPlan: false, approved: false, activities: [] } };
class FakeCodex {
  listeners = new Set(); requests = []; account = { type: 'chatgpt', planType: 'plus' }; delay = 0;
  reply = { answer: 'Start by clarifying your research question.', actions: [], memory: '' };
  limits = { ordinaryUsageAllowed: true, rateLimits: { primary: { usedPercent: 10 }, secondary: { usedPercent: 20 } } };
  async start() {}
  stop() {}
  async request(method, params) {
    this.requests.push({ method, params });
    if (method === 'account/read') return { account: this.account };
    if (method === 'account/rateLimits/read') return this.limits;
    if (method === 'thread/start') return { thread: { id: 'test-thread' } };
    if (method === 'thread/resume') return { thread: { id: params.threadId } };
    if (method === 'turn/interrupt') { this.cancelled = true; for(const fn of this.listeners)fn({method:'turn/completed',params:{threadId:'test-thread',turn:{id:'turn-1',status:'interrupted'}}});return {}; }
    if (method === 'turn/start') {
      const emit = (method, data) => { for (const fn of this.listeners) fn({ method, params: { threadId: 'test-thread', ...data } }); };
      emit('turn/started', { turn: { id: 'turn-1' } });
      setTimeout(() => { if(this.cancelled)return;emit('item/completed', { item: { type: 'agentMessage', text: JSON.stringify(this.reply), phase: 'final_answer' } }); emit('turn/completed', { turn: { id: 'turn-1', status: 'completed' } }); }, this.delay);
      return { turn: { id: 'turn-1' } };
    }
    return {};
  }
}
test('subscription-only blocks API-key and signed-out accounts before starting any conversation', async t => {
  const root = await fixture(t), connection = new FakeCodex(), service = new CompanionService({ root, connection });
  for (const account of [null, { type: 'apiKey' }]) { connection.account = account; await assert.rejects(service.ask(question), /Subscription-only/); }
  assert.equal(connection.requests.some(r => r.method === 'thread/start' || r.method === 'turn/start'), false);
});
test('conversation survives restart and only validated replies are saved', async t => {
  const root = await fixture(t), first = new FakeCodex();
  const service = new CompanionService({ root, connection: first }); await service.ask(question);
  const second = new FakeCodex(), restored = new CompanionService({ root, connection: second });
  const status = await restored.status(); assert.equal(status.messages.length, 2); assert.equal(status.billing, 'subscription-only'); assert.deepEqual(status.skills, []);
  await restored.ask(question); assert.equal(second.requests.some(r => r.method === 'thread/resume'), true);
  second.reply = { answer: 'Invalid', actions: [{ kind: 'delete_project' }], memory: 'Do not save' };
  await assert.rejects(restored.ask(question), /validated/);
  assert.equal((await restored.status()).messages.length, 4);
  await assert.rejects(readFile(path.join(root, 'graduation-context/companion-notes.md')));
});
test('exhausted or unverifiable included allowance blocks model requests even when paid credits exist', async t => {
  const root = await fixture(t), connection = new FakeCodex(), service = new CompanionService({ root, connection });
  connection.limits = { rateLimits: { primary: { usedPercent: 100 }, secondary: { usedPercent: 30 }, credits: { hasCredits: true } } };
  await assert.rejects(service.ask(question), /allowance is exhausted/);
  connection.limits = {}; await assert.rejects(service.ask(question), /could not be verified/);
  assert.equal(connection.requests.some(r=>r.method==='turn/start'),false);
});
test('explicit memory reply is persisted as a project note; project context is supplied as untrusted data', async t => {
  const root = await fixture(t), connection = new FakeCodex(); connection.reply.memory = 'The presentation is in four weeks.';
  const service = new CompanionService({ root, connection }); await service.ask({ ...question, message: 'Remember: the presentation is in four weeks.' });
  assert.match(await readFile(path.join(root, 'graduation-context/companion-notes.md'), 'utf8'), /four weeks/);
  assert.match(connection.requests.find(r => r.method === 'turn/start').params.input[0].text, /untrusted reference material/);
});
test('simultaneous submissions cannot corrupt one shared conversation', async t => {
  const root = await fixture(t), connection = new FakeCodex(); connection.delay = 30;
  const service = new CompanionService({ root, connection }), first = service.ask(question);
  await assert.rejects(service.ask(question), /another question/); await first;
});
test('stopping a reply does not save a late answer or notes', async t => {
  const root=await fixture(t),connection=new FakeCodex();connection.delay=100;connection.reply.memory='Do not save a cancelled note';
  const service=new CompanionService({root,connection}),reply=service.ask(question);
  const rejected=assert.rejects(reply,/stopped/);
  await new Promise(resolve=>setTimeout(resolve,30));await service.cancel();await rejected;
  assert.equal((await service.status()).messages.length,0);
  await assert.rejects(readFile(path.join(root,'graduation-context/companion-notes.md')));
});
test('context excludes hidden/unsupported content and explicitly identifies truncation', async t => {
  const root = await fixture(t), folder = path.join(root, 'graduation-context');
  await writeFile(path.join(folder, 'brief.md'), 'A'.repeat(20000)); await writeFile(path.join(folder, '.env'), 'secret'); await writeFile(path.join(folder, 'picture.png'), 'unreadable');
  const result = await readContext(folder);
  assert.equal(result.files.find(f => f.name === 'brief.md').status, 'truncated'); assert.equal(result.files.find(f => f.name === 'brief.md').text.length, 16000);
  assert.equal(result.files.some(f => f.name === '.env'), false); assert.match(result.files.find(f => f.name === 'picture.png').status, /Unsupported/);
});
test('visible controls are required for website actions and mixed edits are rejected',async t=>{
 const root=await fixture(t),connection=new FakeCodex(),service=new CompanionService({root,connection});
 connection.reply={answer:'Opening the form.',actions:[{kind:'ui_click',target:'ui-1',value:''}],memory:'',needsNextStep:true};
 await assert.rejects(service.ask(question),/not on the current screen/);
 const input={...question,context:{...question.context,ui:{id:crypto.randomUUID(),screen:'Home',controls:[{target:'ui-1',kind:'button',label:'Add new project',value:''}]}}};
 const reply=await service.ask(input);assert.equal(reply.actions[0].target,'ui-1');assert.equal(reply.needsNextStep,true);assert.equal(reply.uiSnapshotId,input.context.ui.id);
 connection.reply.actions.push({kind:'session_duration',sessionId:crypto.randomUUID(),activityId:'',minutes:60});await assert.rejects(service.ask(input),/separately/);
});
test('loaded conversations are reused instead of resumed before every question',async t=>{const root=await fixture(t),connection=new FakeCodex(),service=new CompanionService({root,connection});await service.ask(question);await service.ask(question);assert.equal(connection.requests.filter(r=>r.method==='thread/start').length,1);assert.equal(connection.requests.filter(r=>r.method==='thread/resume').length,0);assert.equal(connection.requests.filter(r=>r.method==='turn/start')[0].params.effort,'low');});
test('website handoff migrates the existing conversation without resetting its identity or history',async t=>{const root=await fixture(t);await mkdir(path.join(root,'.companion'));await writeFile(path.join(root,'.companion/conversation.json'),JSON.stringify({threadId:'test-thread',policyVersion:'website-controls-v1',messages:[{role:'user',text:'Keep my conversation'}]}));const connection=new FakeCodex(),service=new CompanionService({root,connection});await service.ask({...question,message:'Create a project planning'});const injection=connection.requests.find(r=>r.method==='thread/inject_items');assert.equal(injection.params.threadId,'test-thread');assert.match(injection.params.items[0].content[0].text,/Create project & plan sessions/);assert.match(injection.params.items[0].content[0].text,/use it verbatim/);assert.match(injection.params.items[0].content[0].text,/aria-pressed=true/);assert.equal(connection.requests.some(r=>r.method==='thread/start'),false);assert.equal(connection.requests.find(r=>r.method==='turn/start').params.effort,'medium');const state=JSON.parse(await readFile(path.join(root,'.companion/conversation.json'),'utf8'));assert.equal(state.policyVersion,websiteGuideVersion);assert.equal(state.messages[0].text,'Keep my conversation');await service.ask(question);assert.equal(connection.requests.filter(r=>r.method==='thread/inject_items').length,1);});
test('streamed text decodes only the public answer without exposing action JSON',()=>{assert.equal(streamedAnswer('{"actions":['),'');assert.equal(streamedAnswer('{"answer":"Hello\\nSam\\u0021","actions":['),'Hello\nSam!');assert.equal(streamedAnswer('{"answer":"Hello\\u00'),'Hello');});
test('local bridge refuses remote hosts, cross-origin writes and missing tokens', () => {
  const options = { port: 5181, token: 'correct' };
  const req = { socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:5181', origin: 'http://127.0.0.1:5181', 'content-type': 'application/json', 'x-companion-token': 'correct' } };
  assert.equal(allowedRequest(req, options, true), true);
  assert.equal(allowedRequest({ ...req, socket: { remoteAddress: '192.168.0.2' } }, options, true), false);
  for (const headers of [{ host: 'evil.test:5181' }, { origin: 'https://evil.test' }, { 'x-companion-token': '' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal(allowedRequest({ ...req, headers: { ...req.headers, ...headers } }, options, true), false);
});
