export const targets = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'ar'];

export function parseQuery(query) {
  const match = query.match(/^:([a-z-]+)(?:\s+|$)/i);
  if (!match) return { text: query, target: null };
  const target = match[1].toLowerCase();
  if (!targets.includes(target)) throw new Error(`不支持的目标语言；可用：${targets.join(', ')}`);
  return { text: query.slice(match[0].length).trim(), target };
}

export function languagePreferences(env = process.env) {
  const primary = (env.target_language || 'zh').trim().toLowerCase();
  const secondary = (env.secondary_language || 'en').trim().toLowerCase();
  for (const [name, value] of [['target_language', primary], ['secondary_language', secondary]]) {
    if (!targets.includes(value)) throw new Error(`${name}: 不支持的语言 / Unsupported language; ${targets.join(', ')}`);
  }
  if (primary === secondary) throw new Error('首选目标语言和第二语言必须不同 / Choose different target and secondary languages');
  return { primary, secondary };
}

const providerLanguage = lang => lang === 'zh' ? 'zh-Hans' : lang;

export function direction(query, preferences = languagePreferences()) {
  const parsed = parseQuery(query);
  const foreignScript = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(parsed.text);
  const chinese = /\p{Script=Han}/u.test(parsed.text) && !foreignScript;
  const words = parsed.text.replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/_/g, ' ');
  const target = parsed.target || (chinese && preferences.primary === 'zh' ? preferences.secondary : preferences.primary);
  return { from: 'auto-detect', to: providerLanguage(target), text: words };
}

// Pure kanji can be ambiguous. Respect the provider's detected source language.
export function resolvedTarget(query, detected, preferences = languagePreferences()) {
  const parsed = parseQuery(query);
  if (parsed.target) return providerLanguage(parsed.target);
  const source = (detected || '').toLowerCase().split('-')[0];
  return providerLanguage(source === preferences.primary ? preferences.secondary : preferences.primary);
}
