import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, saveState } from '../src/core.mjs';
import { selectProviders } from '../src/providers.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));

test('CLI rejects empty/oversized input and disabled sources without starting workers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alfred-cli-test-'));
  try {
    for (const [query, sources, title] of [['', 'Youdao', '输入'], ['a'.repeat(2001), 'Youdao', '过长'], ['hello', '', '启用']]) {
      const { stdout } = await run(process.execPath, ['src/cli.mjs', '--query', query], {
        cwd: root, env: { ...process.env, alfred_workflow_cache: dir, providers: sources }
      });
      const data = JSON.parse(stdout);
      assert.match(data.items[0].title, new RegExp(title));
      assert.equal(data.items[0].valid, false);
    }
    assert.deepEqual(await readdir(dir), []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('CLI isolates queries, reads partial state and never interprets shell syntax', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'alfred-cli-test-'));
  try {
    const values = ['hello', 'world', '$(touch NEVER_CREATE_THIS); `id` " & 中文', '--action', '--worker'];
    for (const [index, query] of values.entries()) {
      await saveState(join(dir, `${cacheKey(query, Object.keys(selectProviders(['Youdao'], query)))}.json`), {
        id: 'fixture', updated: Date.now(), results: { Youdao: { senses: [{ text: `释义${index}`, note: '' }] } },
        pending: index === 0 ? ['Youdao'] : [], errors: {}
      });
    }
    const outputs = await Promise.all(values.map(query => run(process.execPath, ['src/cli.mjs', '--query', query], {
      cwd: root, env: { ...process.env, alfred_workflow_cache: dir, providers: 'Youdao' }
    })));
    outputs.forEach(({ stdout }, index) => {
      const data = JSON.parse(stdout);
      assert.equal(data.items[0].arg, `释义${index}`);
      assert.equal(Boolean(data.rerun), index === 0);
    });
    assert.equal((await readdir(dir)).length, values.length);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('launcher returns valid Alfred guidance for a missing configured Node path', async () => {
  const { stdout } = await run('/bin/bash', ['./launch.sh', 'hello'], {
    cwd: root, env: { ...process.env, node_path: '/nonexistent/alfred-easydict-node' }
  });
  assert.equal(JSON.parse(stdout).items[0].title, '找不到 Node.js');
});
