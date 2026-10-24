export const targets = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'ar'];

export function parseQuery(query) {
  const match = query.match(/^:([a-z-]+)(?:\s+|$)/i);
  if (!match) return { text: query, target: null };
  const target = match[1].toLowerCase();
  if (!targets.includes(target)) throw new Error(`不支持的目标语言；可用：${targets.join(', ')}`);
  return { text: query.slice(match[0].length).trim(), target };
}

export function direction(query) {
  const parsed = parseQuery(query);
  const foreignScript = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(parsed.text);
  const chinese = /\p{Script=Han}/u.test(parsed.text) && !foreignScript;
  const words = parsed.text.replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/_/g, ' ');
  return { from: 'auto-detect', to: parsed.target === 'zh' ? 'zh-Hans' : parsed.target || (chinese ? 'en' : 'zh-Hans'), text: words };
}

// Pure kanji can be ambiguous. Respect the provider's detected source language.
export function resolvedTarget(query, detected) {
  const parsed = parseQuery(query);
  if (parsed.target) return direction(query).to;
  return /^zh(?:-|$)/i.test(detected || '') ? 'en' : 'zh-Hans';
}
