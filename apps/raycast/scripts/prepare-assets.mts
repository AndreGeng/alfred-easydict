import { copyFile, mkdir } from 'node:fs/promises';
const root = new URL('../../../', import.meta.url);
const legal = new URL('../assets/legal/', import.meta.url);
await mkdir(legal, { recursive: true });
for (const name of ['LICENSE', 'THIRD_PARTY.md', 'licenses/Raycast-Easydict-MIT.txt']) {
  await copyFile(new URL(name, root), new URL(name.split('/').at(-1)!, legal));
}

// Raycast's production CLI checks this exact local path; npm workspaces hoists tsc.
const { createRequire } = await import('node:module');
const { access, symlink } = await import('node:fs/promises');
const require = createRequire(import.meta.url);
const bin = new URL('../node_modules/.bin/', import.meta.url);
await mkdir(bin, { recursive: true });
try { await access(new URL('tsc', bin)); }
catch { await symlink(require.resolve('typescript/bin/tsc'), new URL('tsc', bin)); }
