import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareQuery, resultRows, createSearchSession, pronunciationText } from '../vicinae/src/model.mjs';

const state = value => ({ updated: Date.now(), results: { Google: value }, errors: {}, pending: [] });
test('Vicinae preserves suggestion copy, speech, full text and ordering', () => {
  const rows = resultRows('tra', { ...state('译文'), results: {
    Youdao: { senses: [{ text: '释义' }] }, Suggest: [{ word: 'travel', explanation: '旅行' }], Google: '译文',
  } });
  assert.equal(rows[0].copy, '释义');
  assert.equal(rows[0].speak, 'tra');
  assert.equal(rows[1].copy, 'travel');
  assert.equal(rows[1].speak, 'travel');
  assert.equal(rows[1].completion, 'travel');
  assert.equal(rows[1].fullText, 'travel\n旅行');
  assert.ok(!rows[0].subtitle.includes('⌘'));
});
test('Vicinae validates preferences and isolates cache by language pair', () => {
  const a = prepareQuery('hello');
  const b = prepareQuery('hello', { target_language: 'ja', secondary_language: 'en' });
  assert.notEqual(a.key, b.key);
  assert.throws(() => prepareQuery('hello', { target_language: 'en', secondary_language: 'en' }));
  assert.throws(() => prepareQuery(':xx hello'));
  assert.throws(() => prepareQuery(':ja hello', { providers: 'Youdao' }));
  assert.equal(prepareQuery('hello', { cache_hours: '0' }).ttl, 0);
  assert.deepEqual(Object.keys(prepareQuery(':ja hello').selected), ['Google']);
});
test('late queries cannot overwrite newer results or cache', async () => {
  const finishes = {}, visible = [], writes = [];
  const session = createSearchSession({ get() {}, set(...args) { writes.push(args); } },
    value => visible.push(value), (query, providers, update) => new Promise(resolve => {
      finishes[query] = () => { update(state(query)); resolve(state(query)); };
    }));
  const first = session.search(prepareQuery('first'));
  const second = session.search(prepareQuery('second'));
  finishes.second(); await second;
  finishes.first(); await first;
  assert.equal(visible.at(-1).results.Google, 'second');
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(writes[0][1]).results.Google, 'second');
});
test('valid cached responses avoid requests; cancel suppresses late updates', async () => {
  let calls = 0; const visible = [];
  const session = createSearchSession({ get: () => JSON.stringify(state('cached')) },
    x => visible.push(x), () => { calls++; });
  await session.search(prepareQuery('hello'));
  assert.equal(calls, 0); assert.equal(visible[0].results.Google, 'cached');
  let finish;
  const pending = createSearchSession({ get() {}, set() {} }, x => visible.push(x),
    () => new Promise(resolve => { finish = resolve; }));
  const work = pending.search(prepareQuery('next'));
  pending.cancel(); const count = visible.length;
  finish(state('late')); await work;
  assert.equal(visible.length, count);
});

test('speech passes untrusted text as one argument without a shell', async () => {
  const { speechCommand } = await import('../vicinae/src/speech.mjs');
  const text = '-n $(touch /tmp/not-executed)';
  assert.deepEqual(speechCommand(text, 'darwin'), ['/usr/bin/say', ['--', text]]);
  assert.deepEqual(speechCommand(text, 'linux'), ['spd-say', ['--wait', '--', text]]);
});

test('existing Alfred provider selection keeps default function identity', async () => {
  const { selectProviders, providers } = await import('../src/providers.mjs');
  const selected = selectProviders(['Google', 'Bing'], 'hello');
  assert.equal(selected.Google, providers.Google);
  assert.equal(selected.Bing, providers.Bing);
});

test('explicit per-client language preferences reach both translators without mutating the environment', async () => {
  const { selectProviders, providers } = await import('../src/providers.mjs');
  const before = process.env.target_language;
  const preferences = { primary: 'fr', secondary: 'ja' };
  const original = { Google: providers.Google, Bing: providers.Bing };
  try {
    for (const name of ['Google', 'Bing']) providers[name] = async (query, signal, received) => {
      assert.equal(query, 'hello'); assert.equal(received, preferences); return name;
    };
    const selected = selectProviders(['Google', 'Bing'], 'hello', preferences);
    assert.equal(await selected.Google('hello'), 'Google');
    assert.equal(await selected.Bing('hello'), 'Bing');
    assert.equal(process.env.target_language, before);
  } finally { Object.assign(providers, original); }
});

test('pronunciation preview preserves both accents and distinguishes missing, pending and failure', () => {
  const phonetic = '美 /ˌɪnspəˈreɪʃn/ · 英 /ˌɪnspəˈreɪʃn/';
  assert.equal(pronunciationText({ ...state(''), results: { Youdao: { phonetic } } }), phonetic);
  assert.equal(pronunciationText(null), '正在加载音标…');
  assert.equal(pronunciationText({ ...state(''), pending: ['Youdao'] }), '正在加载音标…');
  assert.equal(pronunciationText(state('')), '词典未提供音标');
  assert.match(pronunciationText({ ...state(''), errors: { Youdao: 'failed' } }), /失败/);
});
