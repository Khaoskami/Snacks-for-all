import { existsSync, mkdirSync, mkdtempSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Always resolve against this package, not Railway's outer working directory.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const proxy = join(root, 'src', 'proxy.ts');
if (!existsSync(proxy)) {
  throw new Error('Missing src/proxy.ts. Upload the complete replacement project before building.');
}

// A GitHub file upload replaces matching files but cannot remove old filenames.
// Disable only the obsolete Next.js middleware entrypoints. Keep their contents
// in non-code backups; never touch account data, environment files or other code.
let backupDirectory;
for (const directory of ['', 'src']) {
  for (const extension of ['ts', 'tsx', 'js', 'jsx']) {
    const relative = join(directory, `middleware.${extension}`);
    const source = join(root, relative);
    if (!existsSync(source)) continue;
    if (!backupDirectory) {
      const backupRoot = join(root, '.legacy-build-backups');
      mkdirSync(backupRoot, { recursive: true });
      backupDirectory = mkdtempSync(join(backupRoot, 'run-'));
    }
    const destination = join(backupDirectory, `${directory || 'root'}-middleware.${extension}.disabled`);
    renameSync(source, destination);
    console.log(`[prepare-build] Disabled legacy ${relative}; authentication uses src/proxy.ts.`);
  }
}
console.log('[prepare-build] Proxy entrypoint ready.');
