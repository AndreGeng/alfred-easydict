import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSearchSession, prepareQuery, resultRows } from '@easydict/core/session';
import type { QueryState } from '@easydict/core/types';

test('shared session enforces expiry with Raycast-style cache without native TTL', async () => {
  const plan = prepareQuery(':ja hello');
  const stale: QueryState = { updated: Date.now() - plan.ttl - 1, results: { Google: 'stale' }, errors: {}, pending: [] };
  const cache = new Map([[plan.key, JSON.stringify(stale)]]);
  const fresh: QueryState = { updated: Date.now(), results: { Google: 'こんにちは' }, errors: {}, pending: [] };
  let calls = 0;
  const published: QueryState[] = [];
  const session = createSearchSession({ get: key => cache.get(key), set: (key, value) => { cache.set(key, value); } },
    state => published.push(state), async () => { calls++; return fresh; });
  await session.search(plan);
  assert.equal(calls, 1);
  assert.equal(published.at(-1), fresh);
  assert.equal(resultRows(plan.query, fresh)[0].speak, 'こんにちは');
  await session.search(plan);
  assert.equal(calls, 1);
  assert.equal(published.at(-1)?.results.Google, 'こんにちは');
});

test('Raycast command declares fd, supported platform and existing default preferences', async () => {
  const manifest = JSON.parse(await readFile(new URL('../apps/raycast/package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.title, 'FelixDict');
  assert.deepEqual(manifest.platforms, ['macOS']);
  assert.equal(manifest.commands[0].name, 'search');
  assert.ok(manifest.commands[0].keywords.includes('fd'));
  const prefs = Object.fromEntries(manifest.preferences.map((p: {name:string; default:string}) => [p.name,p.default]));
  assert.equal(prefs.target_language, 'zh');
  assert.equal(prefs.secondary_language, 'en');
  assert.equal(prefs.providers, 'Youdao,Google');
});
