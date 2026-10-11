// Run from the EXTRACTED NEW PACKAGE, targeting a separate local Git clone.
// Old project entries are moved intact to a sibling backup before replacement.
import { existsSync, realpathSync, lstatSync, readFileSync, readdirSync, mkdirSync, mkdtempSync, renameSync, copyFileSync, cpSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetArg = process.argv[2];
if (!targetArg) throw new Error('Usage: node scripts/replace-project.mjs /path/to/existing-git-clone');
const target = realpathSync(resolve(targetArg));
function contains(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
if (contains(source, target) || contains(target, source)) throw new Error('Extract the new package outside the existing repository. Source and target must be separate.');
if (!existsSync(join(target, '.git'))) throw new Error('Target must be an existing local Git clone.');
if (!existsSync(join(target, 'package.json'))) throw new Error('Target must be the application root containing package.json.');
const manifest = JSON.parse(readFileSync(join(source, 'release-files.json'), 'utf8'));
if (!Array.isArray(manifest) || !manifest.includes('package.json') || !manifest.includes('src/proxy.ts')) throw new Error('Invalid release manifest.');
for (const file of manifest) {
  if (typeof file !== 'string' || isAbsolute(file) || file.split(/[\\/]/).includes('..') || !contains(source, resolve(source, file)) || !lstatSync(join(source, file)).isFile()) throw new Error('Invalid or missing release file.');
}
const backup = mkdtempSync(join(dirname(target), `${target.split(/[\\/]/).pop()}-backup-`));
// Stage every replacement before moving any existing application files.
const stage = join(backup, 'new-release');
for (const file of manifest) {
  mkdirSync(dirname(join(stage, file)), { recursive: true });
  copyFileSync(join(source, file), join(stage, file));
}
const old = join(backup, 'previous-project');
mkdirSync(old);
const moved = [];
const installed = [];
try {
  for (const name of readdirSync(target)) {
    if (name === '.git' || name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) continue;
    renameSync(join(target, name), join(old, name));
    moved.push(name);
  }
  for (const name of readdirSync(stage)) {
    cpSync(join(stage, name), join(target, name), { recursive: true, errorOnExist: true, force: false });
    installed.push(name);
  }
} catch (error) {
  // Preserve a failed partial install outside the repository before restoring.
  const failed = join(backup, 'failed-install');
  mkdirSync(failed);
  for (const name of readdirSync(stage)) {
    if (existsSync(join(target, name)) && (installed.includes(name) || moved.includes(name) || !existsSync(join(old, name)))) {
      renameSync(join(target, name), join(failed, name));
    }
  }
  for (const name of moved) renameSync(join(old, name), join(target, name));
  throw error;
}
console.log(`Replaced application files. Previous files preserved at: ${old}`);
console.log('Git history and local .env files were preserved. Review git status, then commit ALL changes (including deletions) and push to Railway’s connected branch.');
