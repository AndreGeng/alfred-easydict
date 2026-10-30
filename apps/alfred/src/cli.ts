import { render } from './render.js';
import { parseQuery, languagePreferences } from '@easydict/core/languages';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, unlink, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { speak } from '@easydict/core/speech';
import { randomUUID } from 'node:crypto';
import { providers, selectProviders } from '@easydict/core/providers';
import { cacheKey, queryProviders, readState, saveState, failureMessage } from '@easydict/core/core';

const script = fileURLToPath(import.meta.url);
const [mode, ...args] = process.argv.slice(2);
const cacheDir = process.env.alfred_workflow_cache || join(homedir(), 'Library/Caches/local.alfred-easydict');
const enabled = (process.env.providers ?? 'Youdao,Google').split(',').map(x => x.trim()).filter(x => Object.hasOwn(providers, x));
const ttlHours = Number(process.env.cache_hours ?? '24');
const ttl = (Number.isFinite(ttlHours) ? Math.max(0, Math.min(168, ttlHours)) : 24) * 3600000;

async function cleanup() {
  for (const file of await readdir(cacheDir)) {
    if (!/^[a-f0-9]{64}\.json(?:\.[a-f0-9-]+\.tmp)?$/.test(file)) continue;
    const path = join(cacheDir, file);
    const info = await stat(path).catch(() => null);
    if (info && Date.now() - info.mtimeMs > Math.max(ttl, 60000)) await unlink(path).catch(() => {});
  }
}

async function worker(query: string, path: string, id: string) {
  await queryProviders(query, selectProviders(enabled, query), async state => {
    // A crashed/expired worker can never replace a new generation of this query.
    const current = await readState(path, Infinity);
    if (current?.id === id) await saveState(path, { ...state, id });
  });
}

async function main() {
  if (mode === '--action') {
    const value = args.join(' ');
    if (process.env.action === 'speak') await speak(value);
    else {
      await new Promise<void>((resolve, reject) => {
        const child = spawn('/usr/bin/pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
        child.on('error', reject);
        child.stdin.on('error', reject);
        child.on('exit', code => code === 0 ? resolve() : reject(new Error('Copy failed')));
        child.stdin.end(value);
      });
    }
    return;
  }
  if (mode === '--worker') {
    const [path, id] = args;
    const state = JSON.parse(await readFile(path, 'utf8'));
    await worker(state.query, path, id);
    return;
  }
  const query = (mode === '--wait' || mode === '--query' ? args : [mode || '', ...args]).join(' ').trim();
  if (!query || query.length > 2000 || !enabled.length) {
    const title = !query ? '输入英文单词、短语或句子' : !enabled.length ? '请在设置中启用 Youdao、Google 或 Bing' : '查询内容过长，请控制在 2000 字符以内';
    console.log(JSON.stringify({ items: [{ title, subtitle: 'Easydict for Alfred · 多语言翻译', valid: false }] }));
    return;
  }
  let parsed;
  try {
    languagePreferences();
    parsed = parseQuery(query);
  } catch (error) {
    console.log(JSON.stringify({ items: [{ title: error instanceof Error ? error.message : 'Invalid query', subtitle: 'Configure Workflow · :ja 你好', valid: false }] }));
    return;
  }
  if (!parsed.text) {
    console.log(JSON.stringify({ items: [{ title: '输入要翻译的内容', subtitle: '例如 :ja 你好', valid: false }] }));
    return;
  }
  if (!Object.keys(selectProviders(enabled, query)).length) {
    console.log(JSON.stringify({ items: [{ title: '请启用 Google 或 Bing 进行多语言翻译', valid: false }] }));
    return;
  }
  if (mode === '--wait') {
    console.log(JSON.stringify(render(query, await queryProviders(query, selectProviders(enabled, query)))));
    return;
  }
  await mkdir(cacheDir, { recursive: true, mode: 0o700 });
  const selected = selectProviders(enabled, query);
  const path = join(cacheDir, `${cacheKey(query, Object.keys(selected))}.json`);
  let state = await readState(path, Math.max(ttl, 20000));
  if (state?.pending.length && Date.now() - state.updated > 15000) {
    state = { ...state, pending: [], errors: { ...state.errors, Worker: '查询中断，请稍后重新查询' } };
    await saveState(path, state);
  }
  const hasErrors = state && Object.keys(state.errors).length;
  const lifetime = state?.pending.length ? 15000 : hasErrors ? 10000 : Math.max(ttl, 1000);
  if (state && Date.now() - state.updated > lifetime) state = null;
  if (!state) {
    const initial = { id: randomUUID(), query, updated: Date.now(), results: {}, errors: {}, pending: Object.keys(selected) };
    try {
      // Exclusive creation deduplicates repeated Alfred reruns and concurrent invocations.
      await writeFile(path, JSON.stringify(initial), { flag: 'wx', mode: 0o600 });
      state = initial;
      const child = spawn(process.execPath, [script, '--worker', path, initial.id], {
        detached: true, stdio: 'ignore', cwd: dirname(script), env: process.env
      });
      child.on('error', async () => {
        await saveState(path, { ...initial, pending: [], errors: { Worker: failureMessage } }).catch(() => {});
      });
      child.unref();
      await cleanup();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      state = await readState(path, Infinity);
      // Expired/corrupt cache: remove now, let the next Alfred rerun acquire it.
      if (!state || Date.now() - state.updated > lifetime) {
        await unlink(path).catch(() => {});
        state = initial;
      }
    }
  }
  console.log(JSON.stringify(render(query, state!)));
}

main().catch(() => {
  // Do not echo URLs, query text, provider tokens or subprocess error output.
  if (mode !== '--worker' && mode !== '--action') console.log(JSON.stringify({ items: [
    { title: '暂时无法查询', subtitle: '检查缓存目录权限和 Node.js 配置后重试', valid: false }
  ] }));
  process.exitCode = 1;
});
