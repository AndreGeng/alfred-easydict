import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const dir = join('dist/release', version);
const enabled = process.env.TEST_RELEASE === '1';
test('release archives contain runnable entries, legal notices and independent source install', { skip: !enabled }, () => {
  const expected: Record<string, string[]> = {
    [`Alfred-FelixDict-${version}.alfredworkflow`]: ['info.plist', 'launch.sh'],
    [`FelixDict-Vicinae-${version}.zip`]: ['easydict-companion/package.json', 'easydict-companion/search.js', 'easydict-companion/assets/legal/LICENSE', 'INSTALL.md'],
    [`FelixDict-Raycast-${version}.rayext`]: ['package.json', 'search.js', 'assets/legal/LICENSE', 'assets/build-info.json'],
    [`FelixDict-Raycast-source-${version}.zip`]: ['package.json', 'package-lock.json', 'apps/raycast/src/search.tsx', 'apps/raycast/assets/build-info.json', 'packages/core/src/core.ts', 'INSTALL.md'].map(x => `FelixDict-Raycast-source-${version}/${x}`),
  };
  const sums = readFileSync(join(dir, 'SHA256SUMS'), 'utf8');
  for (const [file, entries] of Object.entries(expected)) {
    const path = join(dir, file);
    const listing = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' }).trim().split('\n');
    for (const entry of entries) assert.ok(listing.includes(entry), `${file}: missing ${entry}`);
    assert.ok(!listing.some(x => /(^|\/)\.env|(^|\/)\.DS_Store|(^|\/)\.git\//.test(x)), `${file}: private/generated file`);
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    assert.ok(sums.includes(`${hash}  ${file}\n`), `checksum mismatch: ${file}`);
  }
});
