import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { writeBuildInfo } from '../apps/raycast/scripts/build-info.mts';

test('build metadata distinguishes tagged, dirty, and untagged builds and survives source packaging', () => {
  const dir = mkdtempSync(join(tmpdir(), 'felixdict-build-info-'));
  const root = pathToFileURL(dir + '/');
  const output = new URL('build-info.json', root);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  const read = () => JSON.parse(readFileSync(output, 'utf8'));
  try {
    writeFileSync(new URL('package.json', root), JSON.stringify({ version: '0.2.1' }));
    writeFileSync(new URL('.gitignore', root), 'build-info.json\n');
    git('init'); git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture');
    writeBuildInfo(root, output);
    assert.equal(read().release, false);
    git('tag', 'v0.2.1');
    writeBuildInfo(root, output);
    assert.equal(read().release, true);
    const released = read();
    writeFileSync(new URL('uncommitted.txt', root), 'change');
    writeBuildInfo(root, output);
    assert.equal(read().release, false);
    assert.equal(read().dirty, true);
    rmSync(new URL('.git', root), { recursive: true });
    writeFileSync(output, JSON.stringify(released));
    writeBuildInfo(root, output);
    assert.deepEqual(read(), released);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
