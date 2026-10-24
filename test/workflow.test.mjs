import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeYoudao, parseBingConfig, decodeBing, decodeGoogle, direction } from '../src/providers.mjs';
import { queryProviders, render, cacheKey, readState, saveState } from '../src/core.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('English dictionary retains separate meanings, both phonetics and word forms', () => {
  const result = decodeYoudao({ ec: { word: [{ usphone: 'həˈləʊ', ukphone: 'heˈləʊ',
    trs: [{ tr: [{ l: { i: ['int. 你好'] } }] }, { tr: [{ l: { i: ['n. 问候'] } }] }],
    wfs: [{ wf: { name: '复数', value: 'hellos' } }] }] } });
  assert.deepEqual(result.senses.map(s => s.text), ['int. 你好', 'n. 问候']);
  assert.match(result.phonetic, /美.*英/);
  assert.deepEqual(result.forms, ['复数：hellos']);
});

test('Chinese dictionary extracts #text without object stringification', () => {
  const result = decodeYoudao({ ce: { word: [{ trs: [{ tr: [{ l: {
    i: [{ '#text': 'hello' }, { '#text': 'hi' }], pos: 'int.', '#tran': '打招呼'
  } }] }] }] } });
  assert.deepEqual(result.senses, [{ text: 'hello; hi', note: 'int. 打招呼' }]);
});

test('untrusted dictionary data is validated and empty entries ignored', () => {
  for (const input of [null, [], 'oops']) assert.throws(() => decodeYoudao(input));
  const result = decodeYoudao({ ec: { word: [{ trs: [null, { tr: [{ l: { i: [42] } }] }] }] } });
  assert.deepEqual(result.senses, []);
});

test('Bing page parsing validates token fields and rejects changed markup', () => {
  assert.deepEqual(parseBingConfig('IG:"abc" data-iid="translator.1" var params_AbusePreventionHelper = [123,"token",60000];'),
    { ig: 'abc', iid: 'translator.1', key: '123', token: 'token' });
  assert.throws(() => parseBingConfig('<html>captcha</html>'));
  assert.throws(() => parseBingConfig('IG:"abc" var params_AbusePreventionHelper = [null,{},10];'));
  assert.equal(decodeBing([{ translations: [{ text: '你好' }] }]), '你好');
  assert.throws(() => decodeBing({ statusCode: 429 }));
});

test('Chinese including punctuation translates to English; identifiers are split', () => {
  assert.deepEqual(direction('你好，世界！123'), { from: 'auto-detect', to: 'en', text: '你好，世界！123' });
  assert.equal(direction('getHTTPServer').text, 'get HTTP Server');
  assert.equal(direction('hello_world').text, 'hello world');
  assert.equal(direction('hello').to, 'zh-Hans');
});

test('Google joins paragraphs and rejects rate-limit/error responses', () => {
  assert.equal(decodeGoogle([[['你好。', 'Hello.'], ['再见。', 'Bye.']]]), '你好。再见。');
  assert.throws(() => decodeGoogle({ error: 429 }));
  assert.throws(() => decodeGoogle([[[]]]));
  const output = render('hello', { results: { Google: '你好' }, errors: {}, pending: [] });
  assert.equal(output.items[0].arg, '你好');
});

test('fast provider publishes before slow provider and failure keeps good results', async () => {
  let release;
  const slow = new Promise(resolve => { release = resolve; });
  const updates = [];
  const job = queryProviders('hello', {
    Youdao: async () => ({ senses: [{ text: '你好', note: '' }] }),
    Bing: async () => { await slow; throw new Error('secret token and query'); }
  }, state => updates.push(structuredClone(state)));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.at(-1).results.Youdao.senses[0].text, '你好');
  assert.deepEqual(updates.at(-1).pending, ['Bing']);
  release();
  const final = await job;
  assert.equal(final.pending.length, 0);
  assert.equal(final.errors.Bing, '查询失败，请检查网络或稍后重试');
  const output = JSON.stringify(render('hello', final));
  assert.match(output, /你好/);
  assert.doesNotMatch(output, /secret/);
});

test('Alfred rows copy their meaning, speak the query, keep full text and show pending', () => {
  const state = { results: { Youdao: { phonetic: '美 /həloʊ/', senses: [{ text: '你好', note: 'int.' }], forms: [] } }, errors: {}, pending: ['Bing'] };
  const output = render('hello', state);
  assert.equal(output.rerun, 0.3);
  const row = output.items.find(item => item.arg === '你好');
  assert.equal(row.mods.cmd.arg, 'hello');
  assert.equal(row.mods.cmd.variables.action, 'speak');
  assert.match(row.text.largetype, /你好/);
  assert.equal(row.valid, true);
  assert.equal(output.items.at(-1).valid, false);
  assert.equal(render('hello', { results: {}, errors: {}, pending: [] }).items[0].valid, false);
});

test('cache separates queries/options, survives corruption, and expires', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alfred-easydict-test-'));
  try {
    const path = join(dir, 'state.json');
    assert.notEqual(cacheKey('hello', ['Youdao']), cacheKey('world', ['Youdao']));
    assert.notEqual(cacheKey('hello', ['Youdao']), cacheKey('hello', ['Bing']));
    assert.equal(await readState(path, 100), null);
    await writeFile(path, 'bad json');
    assert.equal(await readState(path, 100), null);
    await saveState(path, { updated: Date.now(), pending: [], results: { Bing: '你好' }, errors: {} });
    assert.equal((await readState(path, 1000)).results.Bing, '你好');
    await saveState(path, { updated: 1, pending: [], results: {}, errors: {} });
    assert.equal(await readState(path, 100), null);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
