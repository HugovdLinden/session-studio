import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

export class CodexConnection {
  constructor({ command = process.env.COMPANION_CODEX_BIN || 'codex', cwd, timeout = 30000, realtime = false } = {}) {
    this.command = command; this.cwd = cwd; this.timeout = timeout; this.realtime = realtime;
    this.pending = new Map(); this.listeners = new Set(); this.sequence = 0;
  }
  async start() {
    if (this.ready) return this.ready;
    this.ready = this.initialize().catch(error => { this.ready = null; this.stop(); throw error; });
    return this.ready;
  }
  async initialize() {
    const env = { ...process.env };
    // Never inherit a separately billed API-key fallback.
    for (const key of ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'AZURE_OPENAI_API_KEY']) delete env[key];
    this.child = spawn(this.command, ['app-server', '--listen', 'stdio://', '-c', 'forced_login_method="chatgpt"', ...(this.realtime ? ['--enable', 'realtime_conversation'] : [])], {
      cwd: this.cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], shell: false,
    });
    const child = this.child;
    child.stderr.on('data', () => {}); // Never forward account/configuration logs to the browser.
    child.on('error', () => { if(this.child === child)this.fail(new Error('Codex could not start. Install/sign in to Codex, then restart the companion.')); });
    child.on('exit', () => { if(this.child !== child)return;this.ready = null;this.fail(new Error('The local Codex connection closed. Reconnect to continue.')); });
    createInterface({ input: this.child.stdout }).on('line', line => {
      let value; try { value = JSON.parse(line); } catch { return; }
      if (value.id !== undefined && !value.method) {
        const pending = this.pending.get(value.id); if (!pending) return;
        clearTimeout(pending.timer); this.pending.delete(value.id);
        value.error ? pending.reject(new Error(value.error.message || 'Codex request failed.')) : pending.resolve(value.result);
      } else if (value.method && value.id !== undefined) {
        // This companion does not grant extra command, file, network, or account permissions.
        this.write({ id: value.id, error: { code: -32601, message: 'This action is unavailable in the graduation companion.' } });
      } else for (const listener of this.listeners) listener(value);
    });
    await this.request('initialize', { clientInfo: { name: 'session_studio_companion', title: 'Graduation companion', version: '0.1.0' }, ...(this.realtime ? {capabilities:{experimentalApi:true}} : {}) });
    this.write({ method: 'initialized', params: {} });
  }
  write(value) { if (!this.child?.stdin.writable) throw new Error('Codex is not connected.'); this.child.stdin.write(JSON.stringify(value) + '\n'); }
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Codex did not respond in time. Try reconnecting.')); }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      try { this.write({ id, method, params }); } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }
  fail(error) { for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); } this.pending.clear(); for (const fn of this.listeners) fn({ method: 'connection/closed', params: { message: error.message } }); }
  stop() { const child=this.child;this.child = null;this.ready = null;this.fail(new Error('The local Codex connection closed.'));child?.kill(); }
}

export function subscriptionAccount(account) {
  if (account?.type !== 'chatgpt') throw new Error('Subscription-only mode: sign in to Codex with ChatGPT. API-key accounts are not used.');
  return { plan: account.planType || 'ChatGPT', billing: 'subscription-only' };
}

export function includedAllowance(result) {
  const limits = result?.rateLimitsByLimitId?.codex || result?.rateLimits;
  if (!limits?.primary || !limits?.secondary) throw new Error('The included subscription allowance could not be verified. No request was sent.');
  if (result.ordinaryUsageAllowed === false || limits.spendControlReached || [limits.primary, limits.secondary, limits.individualLimit].some(window => window && window.usedPercent >= 100)) {
    throw new Error('Your included Codex allowance is exhausted. Wait for its reset; this companion will not switch to an API key.');
  }
  return { shortWindowUsed: limits.primary.usedPercent, longWindowUsed: limits.secondary.usedPercent };
}
