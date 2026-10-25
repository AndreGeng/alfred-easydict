import { parseQuery, languagePreferences } from './languages.mjs';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';

export const failureMessage = '查询失败，请检查网络或稍后重试';

export function cacheKey(query, names, preferences = languagePreferences()) {
  return createHash('sha256').update(JSON.stringify([4, query, names, preferences.primary, preferences.secondary])).digest('hex');
}

export async function readState(path, ttl) {
  try {
    const state = JSON.parse(await readFile(path, 'utf8'));
    if (!state || typeof state.updated !== 'number' || !Array.isArray(state.pending) ||
        !state.results || !state.errors || Date.now() - state.updated > ttl) return null;
    return state;
  } catch { return null; }
}

export async function saveState(path, state) {
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 });
    await rename(temp, path);
  } finally { await unlink(temp).catch(() => {}); }
}

export async function queryProviders(query, providers, onUpdate = () => {}) {
  const state = { updated: Date.now(), results: {}, errors: {}, pending: Object.keys(providers) };
  // Serialize persistence: a slower file write must not replace a newer snapshot.
  let writes = Promise.resolve();
  await Promise.all(Object.entries(providers).map(async ([name, provider]) => {
    try { state.results[name] = await provider(query, AbortSignal.timeout(8000)); }
    catch { state.errors[name] = failureMessage; }
    state.pending = state.pending.filter(item => item !== name);
    state.updated = Date.now();
    const snapshot = structuredClone(state);
    writes = writes.then(() => onUpdate(snapshot));
    await writes;
  }));
  return state;
}

function row(query, value, source, note = '') {
  query = parseQuery(query).text;
  return {
    title: value.replace(/\s+/g, ' '), subtitle: `${source}${note ? ` · ${note}` : ''} · ↩ 复制  ⌘↩ 朗读  ⌘L 全文`,
    valid: true, arg: value, variables: { action: 'copy' },
    text: { copy: value, largetype: value },
    mods: { cmd: { valid: true, arg: query, subtitle: '使用 macOS 语音朗读查询内容', variables: { action: 'speak' } } }
  };
}

export function render(query, state) {
  const items = [];
  const dict = state.results.Youdao;
  if (dict) {
    for (const sense of dict.senses || []) items.push(row(query, sense.text, '有道词典', [sense.note, dict.phonetic].filter(Boolean).join(' · ')));
    if (dict.forms?.length) items.push(row(query, dict.forms.join('；'), '词形变化'));
    for (const entry of dict.web || []) items.push(row(query, entry.text, '网络释义', entry.note));
  }
  for (const name of ['Google', 'Bing']) {
    if (state.results[name]) items.push(row(query, state.results[name], `${name} 翻译`));
  }
  const suggestions = (state.results.Suggest || []).map(({ word, explanation }) => ({
    ...row(word, word, explanation || '有道单词联想'),
    autocomplete: word,
    text: { copy: word, largetype: `${word}\n${explanation}` }
  }));
  // Keep the current query's first meaning available, then offer completions.
  items.splice(Math.min(items.length, 1), 0, ...suggestions);
  for (const [name, message] of Object.entries(state.errors)) {
    if (name === 'Suggest') continue;
    items.push({ title: `${name} · ${message}`, subtitle: '其他来源的结果仍可使用', valid: false });
  }
  if (state.pending.length) items.push({ title: `正在查询 ${state.pending.map(name => name === 'Suggest' ? '单词联想' : name).join(' / ')}…`, subtitle: query, valid: false });
  if (!items.length) items.push({ title: '没有找到释义', subtitle: '尝试完整单词或短语；多语言翻译需启用 Google 或 Bing', valid: false });
  return { items, ...(state.pending.length ? { rerun: 0.3 } : {}) };
}
