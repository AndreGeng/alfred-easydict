import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resultItems } from '@easydict/core/results';
import { render } from '../apps/alfred/src/render.ts';
import { resultRows } from '../apps/vicinae/src/model.mts';
import type { QueryState } from '@easydict/core/types';

test('both app adapters preserve the shared result order and action data', () => {
  const state: QueryState = { updated: 0, pending: ['Bing'], errors: {}, results: {
    Youdao: { phonetic: '美 /test/', senses: [{ text: '测试', note: 'n.' }], forms: ['复数：tests'] },
    Suggest: [{ word: 'testing', explanation: '测试中' }], Google: '测试译文'
  } };
  const shared = resultItems('test', state);
  const alfred = render('test', state).items;
  const vicinae = resultRows('test', state);
  assert.deepEqual(alfred.map(row => row.title), shared.map(row => row.title));
  assert.deepEqual(vicinae.map(row => row.title), shared.map(row => row.title));
  for (const [index, row] of shared.entries()) {
    assert.equal(alfred[index].arg, row.copy);
    assert.equal(alfred[index].mods?.cmd.arg, row.speak);
    assert.equal(vicinae[index].copy, row.copy);
    assert.equal(vicinae[index].speak, row.speak);
    assert.ok(!('mods' in row) && !('arg' in row) && !('rerun' in row));
  }
});

test('Vicinae keeps the module format required by its CommonJS build output', async () => {
  const manifest = JSON.parse(await readFile(new URL('../apps/vicinae/package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.type, 'commonjs');
  assert.equal(manifest.dependencies['@easydict/core'], '0.1.6');
});
