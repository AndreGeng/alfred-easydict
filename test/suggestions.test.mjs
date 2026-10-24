import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSuggest, decodeSuggestions, selectProviders } from '../src/providers.mjs';
import { render } from '../src/core.mjs';

test('suggestions run only for English prefixes and enabled Youdao', () => {
  for (const q of ['tr', 'TRANS', 'hello']) assert.equal(canSuggest(q), true);
  for (const q of ['a', '你好', 'hello world', '--action', 'a'.repeat(41)]) assert.equal(canSuggest(q), false);
  assert.ok(selectProviders(['Youdao', 'Google'], 'trans').Suggest);
  assert.equal(selectProviders(['Google'], 'trans').Suggest, undefined);
  assert.equal(selectProviders(['Youdao'], '你好').Suggest, undefined);
});

test('decoder filters exact words, duplicates, non-prefixes and unsafe entries', () => {
  const data = { result: { code: 200 }, data: { entries: [
    { entry: 'trans' }, { entry: 'transfer', explain: '转移' },
    { entry: 'TRANSFER' }, { entry: 'other' }, { entry: 'trans<script>' },
    { entry: 42 }, { entry: 'transition', explain: null }
  ] } };
  assert.deepEqual(decodeSuggestions(data, 'trans'), [
    { word: 'transfer', explanation: '转移' }, { word: 'transition', explanation: '' }
  ]);
  assert.throws(() => decodeSuggestions({ result: { code: 429 } }, 'tr'));
  const many = { result: { code: 200 }, data: { entries: Array.from({ length: 12 }, (_, i) => ({ entry: `trans${String.fromCharCode(97 + i)}` })) } };
  assert.equal(decodeSuggestions(many, 'trans').length, 6);
});

test('candidates copy their word, speak the complete word and show full text; Tab completes', () => {
  const state = { results: { Google: '转移', Suggest: [{ word: 'transfer', explanation: '转移' }] }, pending: [], errors: {} };
  const items = render('trans', state).items;
  assert.equal(items[0].arg, '转移');
  assert.equal(items[1].autocomplete, 'transfer');
  assert.equal(items[1].valid, true);
  assert.equal(items[1].arg, 'transfer');
  assert.equal(items[1].variables.action, 'copy');
  assert.equal(items[1].mods.cmd.arg, 'transfer');
  assert.equal(items[1].mods.cmd.variables.action, 'speak');
  assert.match(items[1].text.largetype, /transfer\n转移/);
  state.results.Suggest = [];
  state.errors.Suggest = 'unavailable';
  assert.equal(render('trans', state).items.length, 1);
});
