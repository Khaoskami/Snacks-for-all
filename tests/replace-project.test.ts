import { expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
it('clean replacement removes stale code while preserving Git, secrets and a complete backup', () => {
  const base = mkdtempSync(join(tmpdir(), 'snacks-replace-'));
  try {
    const source = join(base, 'release');
    const target = join(base, 'existing');
    mkdirSync(join(source, 'scripts'), { recursive: true });
    mkdirSync(join(source, 'src'), { recursive: true });
    mkdirSync(join(target, '.git'), { recursive: true });
    copyFileSync(new URL('../scripts/replace-project.mjs', import.meta.url), join(source, 'scripts', 'replace-project.mjs'));
    writeFileSync(join(source, 'src', 'proxy.ts'), 'new proxy');
    writeFileSync(join(source, 'package.json'), '{"name":"new"}');
    writeFileSync(join(source, 'release-files.json'), JSON.stringify(['package.json', 'src/proxy.ts', 'scripts/replace-project.mjs', 'release-files.json']));
    writeFileSync(join(target, 'package.json'), '{"name":"old"}');
    writeFileSync(join(target, 'obsolete.ts'), 'old code');
    writeFileSync(join(target, '.env.local'), 'KEEP_SECRET=local-fixture');
    execFileSync(process.execPath, [join(source, 'scripts', 'replace-project.mjs'), target]);
    expect(existsSync(join(target, 'obsolete.ts'))).toBe(false);
    expect(existsSync(join(target, '.git'))).toBe(true);
    expect(readFileSync(join(target, '.env.local'), 'utf8')).toBe('KEEP_SECRET=local-fixture');
    expect(readFileSync(join(target, 'src', 'proxy.ts'), 'utf8')).toBe('new proxy');
    const backup = readdirSync(base).find(name => name.startsWith('existing-backup-'))!;
    expect(readFileSync(join(base, backup, 'previous-project', 'obsolete.ts'), 'utf8')).toBe('old code');
    expect(() => execFileSync(process.execPath, [join(source, 'scripts', 'replace-project.mjs'), source], { stdio: 'pipe' })).toThrow();
  } finally { rmSync(base, { recursive: true, force: true }); }
});
