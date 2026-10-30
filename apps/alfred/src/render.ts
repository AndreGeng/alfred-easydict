import { resultItems } from '@easydict/core/results';
import type { QueryState } from '@easydict/core/types';

export function render(query: string, state: QueryState) {
  const items = resultItems(query, state).map(item => ({
    title: item.title,
    subtitle: item.subtitle + (item.copy !== undefined ? ' · ↩ 复制  ⌘↩ 朗读  ⌘L 全文' : ''),
    valid: item.copy !== undefined,
    ...(item.copy !== undefined ? {
      arg: item.copy, variables: { action: 'copy' },
      text: { copy: item.copy, largetype: item.fullText },
      mods: { cmd: { valid: true, arg: item.speak, subtitle: '使用 macOS 语音朗读查询内容', variables: { action: 'speak' } } }
    } : {}),
    ...(item.completion ? { autocomplete: item.completion } : {})
  }));
  return { items, ...(state.pending.length ? { rerun: 0.3 } : {}) };
}
