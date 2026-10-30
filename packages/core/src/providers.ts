import type { Dictionary, Suggestion, Providers, LanguagePreferences } from './types.js';
// Query protocol and dictionary decoding adapted from Raycast-Easydict.
// Copyright (c) 2022–present tisfeng, maxchang3. MIT; see THIRD_PARTY.md.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

const object = (value: unknown): Record<string, unknown> => record(value) ? value : {};

export { direction } from './languages.js';
import { direction, parseQuery, resolvedTarget } from './languages.js';

export function decodeYoudao(data: unknown): Dictionary {
  if (!record(data)) throw new Error('Invalid dictionary response');
  const ec = object(array(object(data.ec).word)[0]);
  const ce = array(object(data.ce).word)[0];
  const entry = ce ? object(ce) : ec;
  const phonetic = ce ? text(object(ce).phone) : [
    ec?.usphone ? `美 /${text(ec.usphone)}/` : '',
    ec?.ukphone ? `英 /${text(ec.ukphone)}/` : ''
  ].filter(Boolean).join(' · ');
  const senses = array(entry?.trs).flatMap(item => {
    const translation = object(array(object(item).tr)[0]).l;
    if (!record(translation)) return [];
    const words = ce
      ? array(translation.i).map(item => text(object(item)['#text'])).filter(Boolean).join('; ')
      : text(array(translation.i)[0]);
    return words ? [{ text: words, note: [text(translation.pos), text(translation['#tran'])].filter(Boolean).join(' ') }] : [];
  });
  const forms = array(ec?.wfs).flatMap(item => {
    const name = text(object(object(item).wf).name), value = text(object(object(item).wf).value);
    return name && value ? [`${name}：${value}`] : [];
  });
  const web = array(object(data.web_trans)['web-translation']).slice(0, 4).flatMap(item => {
    const values = array(object(item).trans).map(item => text(object(item).value)).filter(Boolean);
    return text(object(item).key) && values.length ? [{ text: values.join('；'), note: text(object(item).key) }] : [];
  });
  return { phonetic, senses, forms, web };
}

export function parseBingConfig(html: string) {
  const ig = html.match(/IG:"(.*?)"/)?.[1];
  const iid = html.match(/data-iid="(.*?)"/)?.[1] || 'translator.5023';
  const raw = html.match(/var params_AbusePreventionHelper\s*=\s*(.*?);/)?.[1];
  const params = raw ? JSON.parse(raw) : null;
  if (!ig || !Array.isArray(params) ||
      !['number', 'string'].includes(typeof params[0]) || !Number.isFinite(Number(params[0])) ||
      typeof params[1] !== 'string' || !params[1] || !(Number(params[2]) > 0)) {
    throw new Error('Bing page changed or unavailable');
  }
  return { ig, iid, key: String(params[0]), token: params[1] };
}

export function decodeBing(data: unknown) {
  const value = object(array(object(array(data)[0]).translations)[0]).text;
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid translation response');
  return value;
}

// curl honors HTTPS_PROXY/ALL_PROXY and avoids differences in Node's proxy support.
// Arguments and form bodies are passed separately; query text is never executed.
async function request(url: string, { body, signal }: { body?: string; signal?: AbortSignal } = {}) {
  const args = ['--disable', '--silent', '--show-error', '--fail', '--compressed',
    '--connect-timeout', '3', '--max-time', '7', '--max-filesize', '3145728',
    '--proto', '=https', '--proto-redir', '=https',
    '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36'];
  // Do not forward POST form tokens across redirects.
  if (body) args.push('--header', 'Content-Type: application/x-www-form-urlencoded', '--data', body);
  else args.push('--location', '--max-redirs', '3');
  args.push('--write-out', '\n%{url_effective}', '--url', url);
  const { stdout } = await run('/usr/bin/curl', args, { signal, maxBuffer: 3 * 1024 * 1024, timeout: 8000 });
  const index = stdout.lastIndexOf('\n');
  return { body: stdout.slice(0, index), url: stdout.slice(index + 1) };
}

export async function youdao(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: direction(query).text, le: 'en',
    dicts: JSON.stringify({ count: 99, dicts: [['web_trans', 'ec', 'ce']] }) });
  const response = await request(`https://dict.youdao.com/jsonapi?${params}`, { signal });
  return decodeYoudao(JSON.parse(response.body));
}

export function canSuggest(query: string) {
  return /^[a-z]{2,40}$/i.test(query);
}

export function decodeSuggestions(data: unknown, query: string): Suggestion[] {
  if (!record(data) || object(data.result).code !== 200 || !Array.isArray(object(data.data).entries)) {
    throw new Error('Invalid suggestion response');
  }
  const seen = new Set([query.toLowerCase()]);
  return array(object(data.data).entries).flatMap(item => {
    const word = text(object(item).entry).trim();
    const key = word.toLowerCase();
    if (!/^[a-z][a-z '-]{0,79}$/i.test(word) || !key.startsWith(query.toLowerCase()) || seen.has(key)) return [];
    seen.add(key);
    return [{ word, explanation: text(object(item).explain).trim().slice(0, 300) }];
  }).slice(0, 6);
}

export async function suggest(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query, le: 'en', num: '8', doctype: 'json' });
  const response = await request(`https://dict.youdao.com/suggest?${params}`, { signal });
  return decodeSuggestions(JSON.parse(response.body), query);
}

export function selectProviders(names: string[], query: string, preferences?: LanguagePreferences): Providers {
  const parsed = parseQuery(query);
  const supportedDictionary = !parsed.target && Array.from(query).every(char => !/\p{L}/u.test(char) || /[\p{Script=Han}\p{Script=Latin}]/u.test(char));
  const selected: Providers = Object.fromEntries([...new Set(names)]
    .filter(name => name !== 'Youdao' || supportedDictionary)
    .map(name => [name, preferences
      ? (text: string, signal?: AbortSignal) => providers[name](text, signal, preferences)
      : providers[name]]));
  if (supportedDictionary && names.includes('Youdao') && canSuggest(query)) selected.Suggest = suggest;
  return selected;
}

export async function bing(query: string, signal?: AbortSignal, preferences?: LanguagePreferences) {
  const page = await request('https://www.bing.com/translator', { signal });
  const origin = new URL(page.url);
  if (origin.protocol !== 'https:' || !['www.bing.com', 'cn.bing.com'].includes(origin.hostname)) {
    throw new Error('Unexpected Bing redirect');
  }
  const config = parseBingConfig(page.body);
  const input = direction(query, preferences);
  const params = new URLSearchParams({ isVertical: '1', IG: config.ig, IID: `${config.iid}.1` });
  const translate = async (target: string) => {
    const body = new URLSearchParams({ text: input.text, fromLang: input.from, to: target,
      key: config.key, token: config.token }).toString();
    const response = await request(`${origin.origin}/ttranslatev3?${params}`, { body, signal });
    const data = JSON.parse(response.body);
    return { value: decodeBing(data), detected: text(data[0]?.detectedLanguage?.language) };
  };
  const first = await translate(input.to);
  const target = first.detected ? resolvedTarget(query, first.detected, preferences) : input.to;
  return target === input.to ? first.value : (await translate(target)).value;
}

export function decodeGoogle(data: unknown) {
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('Invalid Google response');
  const value = data[0].map(segment => text(array(segment)[0])).join('');
  if (!value.trim()) throw new Error('Empty Google translation');
  return value;
}

// Independently implemented HTTP adapter; upstream currently uses a separate npm library.
export async function google(query: string, signal?: AbortSignal, preferences?: LanguagePreferences) {
  const input = direction(query, preferences);
  const translate = async (target: string) => {
    const params = new URLSearchParams({ client: 'dict-chrome-ex', sl: 'auto',
      tl: target === 'zh-Hans' ? 'zh-CN' : target, dt: 't', q: input.text });
    const response = await request(`https://translate.googleapis.com/translate_a/single?${params}`, { signal });
    const data = JSON.parse(response.body);
    return { value: decodeGoogle(data), detected: text(data[2]) };
  };
  const first = await translate(input.to);
  const target = first.detected ? resolvedTarget(query, first.detected, preferences) : input.to;
  return target === input.to ? first.value : (await translate(target)).value;
}

export const providers: Providers = { Youdao: youdao, Google: google, Bing: bing };
