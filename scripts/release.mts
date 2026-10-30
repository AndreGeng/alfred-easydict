import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version: string = manifest.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Release version must be x.y.z');
const out = join(root, 'dist', 'release', version);
const stage = await mkdtemp(join(tmpdir(), 'felixdict-release-'));
const run = (command: string, args: string[], cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
await mkdir(out, { recursive: true });
const artifacts: string[] = [];
async function zip(name: string, cwd: string, entries: string[]) {
  const target = join(out, name);
  // zip updates existing archives: remove only this generated artifact to prevent stale entries.
  await rm(target, { force: true });
  run('zip', ['-q', '-r', target, ...entries], cwd);
  artifacts.push(target);
}
try {
  run('npm', ['run', 'build:alfred']);
  const alfred = `Alfred-FelixDict-${version}.alfredworkflow`;
  await copyFile(join(root, 'dist', alfred), join(out, alfred));
  artifacts.push(join(out, alfred));

  const vici = join(stage, 'vicinae');
  await mkdir(vici);
  run('npm', ['run', 'build:vicinae', '--', '--out', join(vici, 'easydict-companion')]);
  await copyFile(join(root, 'docs/install-vicinae.md'), join(vici, 'INSTALL.md'));
  await zip(`FelixDict-Vicinae-${version}.zip`, vici, ['easydict-companion', 'INSTALL.md']);

  run('node', ['--experimental-strip-types', 'scripts/prepare-assets.mts'], join(root, 'apps/raycast'));
  const rayext = join(out, `FelixDict-Raycast-${version}.rayext`);
  run(join(root, 'node_modules/.bin/ray'), ['bundle', '--exit-on-error', '--output', rayext], join(root, 'apps/raycast'));
  artifacts.push(rayext);

  // Include an independently installable fallback for clients that cannot import .rayext.
  // Preserve the root lockfile and all workspace manifests; never copy local settings or caches.
  const sourceName = `FelixDict-Raycast-source-${version}`;
  const source = join(stage, sourceName);
  await mkdir(source);
  for (const entry of ['package.json', 'package-lock.json', 'tsconfig.base.json', 'apps', 'packages', 'licenses', 'LICENSE', 'THIRD_PARTY.md']) {
    await cp(join(root, entry), join(source, entry), { recursive: true, filter: path =>
      !['node_modules', 'dist', '__pycache__', '.DS_Store', 'raycast-env.d.ts', 'vicinae-env.d.ts'].includes(basename(path)) &&
      !path.endsWith('.rayext') && !path.endsWith('.log') && !basename(path).startsWith('.env') });
  }
  await copyFile(join(root, 'docs/install-raycast.md'), join(source, 'INSTALL.md'));
  await zip(`${sourceName}.zip`, stage, [sourceName]);
  const sums = await Promise.all(artifacts.map(async path =>
    `${createHash('sha256').update(await readFile(path)).digest('hex')}  ${basename(path)}`));
  await writeFile(join(out, 'SHA256SUMS'), sums.join('\n') + '\n');
  // Verify ZIP integrity and required runtime entries before the workflow can upload anything.
  for (const path of artifacts) run('unzip', ['-tq', path]);
  console.log(`Release artifacts: ${resolve(out)} (${(await readdir(out)).length} files)`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
