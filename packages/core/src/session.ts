import { resultItems } from './results.js';
import type { QueryState } from './types.js';
import { cacheKey, queryProviders } from './core.js';
import { languagePreferences, parseQuery } from './languages.js';
import { selectProviders } from './providers.js';

export function prepareQuery(input: string, settings: Record<string, string | undefined> = {}) {
  const query = input.trim();
  if (!query) throw new Error('输入单词、词语或句子 / Enter a word or sentence');
  if (query.length > 2000) throw new Error('查询内容不能超过 2000 字符');
  const preferences = languagePreferences(settings);
  if (!parseQuery(query).text) throw new Error('输入要翻译的内容，例如 :ja 你好');
  const names = (settings.providers ?? 'Youdao,Google').split(',').map(x => x.trim())
    .filter(x => ['Youdao', 'Google', 'Bing'].includes(x));
  const selected = selectProviders(names, query, preferences);
  if (!Object.keys(selected).length) throw new Error('请启用 Youdao、Google 或 Bing；多语言翻译需要 Google 或 Bing');
  const hours = Number(settings.cache_hours ?? 24);
  const ttl = (Number.isFinite(hours) ? Math.max(0, Math.min(168, hours)) : 24) * 3600000;
  return { query, selected, ttl, key: cacheKey(query, Object.keys(selected), preferences) };
}

// Preserve Alfred's ordering and action payloads without duplicating dictionary decoding.
export function resultRows(query: string, state: QueryState) {
  return resultItems(query, state).map((item, index) => ({
    ...item, id: `${item.completion ? 'suggest' : 'result'}:${index}:${item.title}`,
  }));
}

// A command-scoped generation guard prevents late responses from replacing newer input.
export function createSearchSession(cache: { get(key: string): string | undefined; set(key: string, value: string, options: { ttl: number }): void }, publish: (state: QueryState) => void, run: typeof queryProviders = queryProviders) {
  let generation = 0;
  return {
    cancel() { generation++; },
    async search(plan: ReturnType<typeof prepareQuery>) {
      const id = ++generation;
      const emit = (state: QueryState) => { if (id === generation) publish(state); };
      if (plan.ttl > 0) {
        try {
          const cached = JSON.parse(cache.get(plan.key) || 'null');
          if (cached && Date.now() - cached.updated < plan.ttl && cached.pending?.length === 0 &&
              cached.results && cached.errors && !Object.keys(cached.errors).length) {
            emit(cached);
            return;
          }
        } catch { /* A broken cache must not stop a network query. */ }
      }
      emit({ updated: Date.now(), results: {}, errors: {}, pending: Object.keys(plan.selected) });
      const state = await run(plan.query, plan.selected, emit);
      if (id !== generation) return;
      emit(state);
      if (plan.ttl > 0 && !Object.keys(state.errors).length) {
        try { cache.set(plan.key, JSON.stringify(state), { ttl: plan.ttl }); } catch { /* Results remain usable. */ }
      }
    },
  };
}

// Keep pronunciation outside truncated list subtitles; never infer it from spelling.
export function pronunciationText(state: QueryState | null) {
  if (!state || state.pending?.includes('Youdao')) return '正在加载音标…';
  if (state.errors?.Youdao) return '音标加载失败，请重新选中重试';
  return state.results?.Youdao?.phonetic || '词典未提供音标';
}
