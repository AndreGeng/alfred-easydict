import type { QueryState, Providers } from './types.js';
import { languagePreferences } from './languages.js';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';

export const failureMessage = '查询失败，请检查网络或稍后重试';

export function cacheKey(query: string, names: string[], preferences = languagePreferences()) {
  return createHash('sha256').update(JSON.stringify([4, query, names, preferences.primary, preferences.secondary])).digest('hex');
}

export async function readState(path: string, ttl: number): Promise<QueryState | null> {
  try {
    const state = JSON.parse(await readFile(path, 'utf8'));
    if (!state || typeof state.updated !== 'number' || !Array.isArray(state.pending) ||
        !state.results || !state.errors || Date.now() - state.updated > ttl) return null;
    return state;
  } catch { return null; }
}

export async function saveState(path: string, state: QueryState) {
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 });
    await rename(temp, path);
  } finally { await unlink(temp).catch(() => {}); }
}

export async function queryProviders(query: string, providers: Providers, onUpdate: (state: QueryState) => void | Promise<void> = () => {}) {
  const state: QueryState = { updated: Date.now(), results: {}, errors: {}, pending: Object.keys(providers) };
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
