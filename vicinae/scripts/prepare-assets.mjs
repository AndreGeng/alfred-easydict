import { copyFile, mkdir } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
const legal = new URL('../assets/legal/', import.meta.url);
await mkdir(legal, { recursive: true });
for (const name of ['LICENSE', 'THIRD_PARTY.md', 'licenses/Raycast-Easydict-MIT.txt']) {
  await copyFile(new URL(name, root), new URL(name.split('/').at(-1), legal));
}
