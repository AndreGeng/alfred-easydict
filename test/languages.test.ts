import type { QueryState, LanguagePreferences } from '@easydict/core/types';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direction, selectProviders } from '@easydict/core/providers';
import { render } from '../apps/alfred/src/render.ts';

test('non-Chinese scripts including Japanese kanji with kana translate to Chinese', () => {
  for (const q of ['今日はいい天気です', '안녕하세요', 'bonjour', 'Привет', 'مرحبا']) {
    assert.equal(direction(q).to, 'zh-Hans');
  }
  assert.equal(direction('你好').to, 'en');
});

test('explicit language prefix selects a target and removes command from content', () => {
  for (const lang of ['ja','ko','fr','de','es','it','pt','ru','ar','en','zh']) {
    const d = direction(`:${lang} 你好`);
    assert.equal(d.text, '你好');
    assert.equal(d.to, lang === 'zh' ? 'zh-Hans' : lang);
  }
  assert.equal(direction('hello: world').text, 'hello: world');
  assert.throws(() => direction(':xx hello'), /语言|language/i);
});

test('foreign scripts and explicit targets avoid the English-Chinese dictionary', () => {
  assert.deepEqual(Object.keys(selectProviders(['Youdao','Google'], '今日はいい天気')), ['Google']);
  assert.deepEqual(Object.keys(selectProviders(['Youdao','Google'], ':fr hello')), ['Google']);
  assert.ok(selectProviders(['Youdao','Google'], 'hello').Youdao);
  const row = render(':ja 你好', {updated: Date.now(), results:{Google:'こんにちは'}, errors:{}, pending:[]}).items[0];
  assert.equal(row.mods!.cmd.arg, '你好');
});

test('upstream language detection corrects ambiguous kanji and respects explicit target', async () => {
  const { resolvedTarget } = await import('@easydict/core/languages');
  assert.equal(resolvedTarget('東京', 'ja'), 'zh-Hans');
  assert.equal(resolvedTarget('你好', 'zh-CN'), 'en');
  assert.equal(resolvedTarget(':en 東京', 'ja'), 'en');
  assert.deepEqual(Object.keys(selectProviders(['Youdao','Google'], 'สวัสดี')), ['Google']);
});

test('CLI guides incomplete/unsupported targets and translation-disabled configurations', async () => {
  const { execFileSync } = await import('node:child_process');
  const cli = (q: string, sources = 'Youdao,Google') => JSON.parse(execFileSync(process.execPath,
    ['apps/alfred/dist/cli.js', '--wait', q], { cwd: new URL('..', import.meta.url), env: { ...process.env, providers: sources }, encoding:'utf8' }));
  assert.match(cli(':ja').items[0].title, /输入要翻译/);
  assert.match(cli(':xx hello').items[0].title, /不支持/);
  assert.match(cli(':fr hello', 'Youdao').items[0].title, /启用 Google 或 Bing/);
});

test('preferred and secondary targets follow detected source, with explicit overrides', async () => {
  const { languagePreferences, resolvedTarget } = await import('@easydict/core/languages');
  const preferences = languagePreferences({ target_language: 'en', secondary_language: 'ja' });
  assert.deepEqual(preferences, { primary: 'en', secondary: 'ja' });
  assert.equal(direction('你好', preferences).to, 'en');
  assert.equal(resolvedTarget('hello', 'en-US', preferences), 'ja');
  assert.equal(resolvedTarget('bonjour', 'fr', preferences), 'en');
  assert.equal(resolvedTarget('你好', 'zh-CN', preferences), 'en');
  assert.equal(resolvedTarget(':fr hello', 'en', preferences), 'fr');
  const japanese = { primary: 'ja', secondary: 'en' };
  assert.equal(resolvedTarget('東京', 'ja', japanese), 'en');
  assert.equal(resolvedTarget('hello', 'en', japanese), 'ja');
  assert.deepEqual(languagePreferences({}), { primary: 'zh', secondary: 'en' });
  assert.deepEqual(languagePreferences({ target_language: ' EN ', secondary_language: 'JA' }), preferences);
  assert.throws(() => languagePreferences({ target_language: 'xx' }), /target_language/);
  assert.throws(() => languagePreferences({ secondary_language: 'xx' }), /secondary_language/);
  assert.throws(() => languagePreferences({ target_language: 'en', secondary_language: 'en' }), /不同|different/);
});
