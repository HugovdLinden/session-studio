import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root = path.resolve(import.meta.dirname, '..');
const env = { ...process.env, SESSION_STUDIO_COMPANION: '1' };
const python = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python', process.platform === 'win32' ? 'python.exe' : 'bin/python');
if (!env.COMPANION_PYTHON && existsSync(python)) env.COMPANION_PYTHON = python;
if (process.platform === 'win32' && !env.COMPANION_CODEX_BIN) {
  const installations = [...new Set([process.env.LOCALAPPDATA,path.join(os.homedir(),'AppData/Local')].filter(Boolean).map(folder=>path.join(folder,'OpenAI/Codex/bin')))];
  for(const installed of installations)if (existsSync(installed)) {
    const candidates = readdirSync(installed).map(name => path.join(installed, name, 'codex.exe')).filter(file => existsSync(file)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    if (candidates[0]) {env.COMPANION_CODEX_BIN = candidates[0];break;}
  }
}
console.log('Starting your local graduation companion at http://127.0.0.1:5181/');
console.log('ChatGPT subscription only. No API-key fallback. Close this launcher to stop it.');
const child = spawn(process.execPath, ['scripts/run-framework.mjs', 'dev', '--host', '127.0.0.1', '--port', '5181', '--strictPort'], { cwd: root, env, windowsHide: true, stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
