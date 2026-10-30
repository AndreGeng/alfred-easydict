import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function writeBuildInfo(root: URL, destination: URL) {
  const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  // Source release archives carry their original metadata and have no Git checkout.
  if (!existsSync(new URL('.git', root)) && existsSync(destination)) {
    const previous = JSON.parse(readFileSync(destination, 'utf8'));
    if (previous.version === version) return;
  }
  const git = (...args: string[]) => execFileSync('git', args, {
    cwd: fileURLToPath(root), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  let commit = 'unknown';
  let release = false;
  let dirty = false;
  if (existsSync(new URL('.git', root))) {
    commit = git('rev-parse', 'HEAD');
    dirty = git('status', '--porcelain').length > 0;
    release = !dirty && git('tag', '--points-at', 'HEAD').split('\n').includes(`v${version}`);
  }
  writeFileSync(destination, JSON.stringify({ version, commit, dirty, release }, null, 2) + '\n');
}
