import { parseQuery } from './languages.js';
import type { QueryState, ResultItem } from './types.js';

function row(query: string, value: string, source: string, note = ''): ResultItem {
  return { title: value.replace(/\s+/g, ' '),
    subtitle: `${source}${note ? ` · ${note}` : ''}`,
    copy: value, speak: parseQuery(query).text, fullText: value };
}

/** Shared presentation order and action data, independent of launcher APIs. */
export function resultItems(query: string, state: QueryState): ResultItem[] {
  const items: ResultItem[] = [];
  const dict = state.results.Youdao;
  if (dict) {
    for (const sense of dict.senses || []) items.push(row(query, sense.text, '有道词典', [sense.note, dict.phonetic].filter(Boolean).join(' · ')));
    if (dict.forms?.length) items.push(row(query, dict.forms.join('；'), '词形变化'));
    for (const entry of dict.web || []) items.push(row(query, entry.text, '网络释义', entry.note));
  }
  for (const name of ['Google', 'Bing'] as const) {
    const value = state.results[name];
    if (value) items.push(row(query, value, `${name} 翻译`));
  }
  const suggestions = (state.results.Suggest || []).map(({ word, explanation }) => ({
    ...row(word, word, explanation || '有道单词联想'), completion: word, fullText: `${word}\n${explanation}`
  }));
  items.splice(Math.min(items.length, 1), 0, ...suggestions);
  for (const [name, message] of Object.entries(state.errors)) {
    if (name !== 'Suggest') items.push({ title: `${name} · ${message}`, subtitle: '其他来源的结果仍可使用' });
  }
  if (state.pending.length) items.push({ title: `正在查询 ${state.pending.map(name => name === 'Suggest' ? '单词联想' : name).join(' / ')}…`, subtitle: query });
  if (!items.length) items.push({ title: '没有找到释义', subtitle: '尝试完整单词或短语；多语言翻译需启用 Google 或 Bing' });
  return items;
}
