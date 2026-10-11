import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const roots: string[] = [];
function fixture(withProxy = true) {
  const root = mkdtempSync(join(tmpdir(), 'snacks-build-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  mkdirSync(join(root, 'scripts'));
  copyFileSync(new URL('../scripts/prepare-build.mjs', import.meta.url), join(root, 'scripts', 'prepare-build.mjs'));
  if (withProxy) writeFileSync(join(root, 'src', 'proxy.ts'), 'canonical proxy');
  return root;
}
function run(root: string) {
  return execFileSync(process.execPath, [join(root, 'scripts', 'prepare-build.mjs')], { cwd: tmpdir(), encoding: 'utf8', stdio: 'pipe' });
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
it('disables old middleware even when invoked outside the project, preserving all contents', () => {
  const root = fixture();
  writeFileSync(join(root, 'src', 'middleware.ts'), 'old source middleware');
  writeFileSync(join(root, 'middleware.js'), 'old root middleware');
  writeFileSync(join(root, '.env'), 'untouched local environment');
  run(root);
  expect(existsSync(join(root, 'src', 'middleware.ts'))).toBe(false);
  expect(existsSync(join(root, 'middleware.js'))).toBe(false);
  expect(readFileSync(join(root, 'src', 'proxy.ts'), 'utf8')).toBe('canonical proxy');
  expect(readFileSync(join(root, '.env'), 'utf8')).toBe('untouched local environment');
  const backup = join(root, '.legacy-build-backups', readdirSync(join(root, '.legacy-build-backups'))[0]);
  expect(readFileSync(join(backup, 'src-middleware.ts.disabled'), 'utf8')).toBe('old source middleware');
  expect(readFileSync(join(backup, 'root-middleware.js.disabled'), 'utf8')).toBe('old root middleware');
  expect(() => run(root)).not.toThrow();
});
it('does not disable middleware if the replacement proxy was not uploaded', () => {
  const root = fixture(false);
  writeFileSync(join(root, 'src', 'middleware.ts'), 'keep this');
  expect(() => run(root)).toThrow();
  expect(readFileSync(join(root, 'src', 'middleware.ts'), 'utf8')).toBe('keep this');
});
