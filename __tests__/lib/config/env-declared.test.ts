import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DECLARED_ENV_VARS } from '@/lib/config/env';

/**
 * `lib/config/env.ts` presents itself as the fail-fast gate for configuration.
 * It was not one: the code read `CRON_SECRET` and the module had never heard of
 * it, so a deployment missing that variable started perfectly and failed once a
 * day at 03:00, into a log nobody reads. The VPS cutover shipped in exactly
 * that state and the gap was found by accident, looking at `vercel.json` for an
 * unrelated reason.
 *
 * Adding the one variable would fix the instance and leave the mechanism just
 * as blind for the next one. This test is the mechanism: every variable the
 * application reads must be declared, so the module's claim to completeness is
 * checked rather than believed.
 *
 * It reads the source rather than importing it, because the point is to catch a
 * variable nobody wired up — and anything importable is by definition already
 * wired somewhere.
 */

const ROOTS = ['app', 'lib', 'middleware.ts'];
const ENV_READ = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

function sourceFiles(path: string): string[] {
  if (statSync(path).isFile()) {
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  }
  return readdirSync(path).flatMap((entry) => sourceFiles(join(path, entry)));
}

function envVarsReadBy(files: string[]): Map<string, string[]> {
  const found = new Map<string, string[]>();

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const [, name] of source.matchAll(ENV_READ)) {
      found.set(name, [...(found.get(name) ?? []), file]);
    }
  }

  return found;
}

describe('environment variable declarations', () => {
  const read = envVarsReadBy(ROOTS.flatMap(sourceFiles));

  it('finds the variables the application reads', () => {
    // A guard on the guard. If the scan silently matched nothing -- a moved
    // directory, a changed pattern -- every assertion below would pass while
    // checking an empty set, which is the failure mode this whole file exists
    // to prevent.
    expect(read.size).toBeGreaterThan(5);
    expect([...read.keys()]).toContain('JWT_SECRET');
  });

  it('declares every variable the application reads', () => {
    const undeclared = [...read.entries()]
      .filter(([name]) => !DECLARED_ENV_VARS.has(name))
      .map(([name, files]) => `${name} (read in ${files.join(', ')})`);

    expect(undeclared).toEqual([]);
  });

  /**
   * The reverse direction matters too, though it is only a warning-shaped
   * assertion: a declared variable nobody reads is configuration that every
   * deployment is asked to carry for nothing, and the next person cannot tell
   * whether removing it is safe.
   */
  it('reads every variable it declares', () => {
    const unread = [...DECLARED_ENV_VARS].filter((name) => !read.has(name));

    expect(unread).toEqual([]);
  });
});
