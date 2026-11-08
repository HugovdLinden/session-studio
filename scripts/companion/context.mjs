import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
const supported = new Set(['.md', '.txt', '.csv', '.json', '.pdf', '.docx']);
const extracted=new Map();

export async function readContext(directory, { python = process.env.COMPANION_PYTHON } = {}) {
  const root = await realpath(directory), files = []; let budget = 48000;
  async function walk(folder, depth = 0) {
    if (depth > 3) return;
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (files.length >= 60 || entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      const filename = path.join(folder, entry.name), relative = path.relative(root, filename);
      if (entry.isDirectory()) { await walk(filename, depth + 1); continue; }
      if (!entry.isFile()) continue;
      const canonical = await realpath(filename);
      if (path.relative(root, canonical).startsWith('..') || path.isAbsolute(path.relative(root, canonical))) continue;
      const extension = path.extname(entry.name).toLowerCase();
      const item = { name: relative.replaceAll('\\', '/'), status: 'ready', text: '' };
      const info = await stat(filename);
      if (!supported.has(extension)) item.status = 'Unsupported format; use text, Markdown, CSV, JSON, DOCX or PDF.';
      else if (info.size > 10 * 1024 * 1024) item.status = 'Larger than 10 MB; split into smaller documents.';
      else if (budget <= 0) item.status = 'Context limit reached; ask about fewer/smaller documents.';
      else try {
        let content;
        if (['.pdf', '.docx'].includes(extension)) {
          if (!python) throw new Error('Python document reader unavailable; save as plain text.');
          const cacheKey=`${canonical}:${info.mtimeMs}:${info.size}:${python}`;
          content=extracted.get(cacheKey);
          if(content===undefined){const result = await execute(python, [path.join(import.meta.dirname, 'extract-document.py'), filename], { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });content=result.stdout;if(extracted.size>=120)extracted.delete(extracted.keys().next().value);extracted.set(cacheKey,content);}
        } else content = await readFile(filename, 'utf8');
        if (!content.trim()) throw new Error('No readable text; scanned PDFs need OCR.');
        const limit = Math.min(16000, budget);
        item.text = content.slice(0, limit); budget -= item.text.length;
        if (content.length > limit) item.status = 'truncated';
      } catch (error) { item.status = error.message?.includes('Python') || error.message?.includes('OCR') ? error.message : 'Could not extract this document; save as plain text.'; }
      files.push(item);
    }
  }
  await walk(root);
  return { folder: root, files };
}
