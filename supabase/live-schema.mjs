// Reads the live schema straight from the deployed database, so nobody has to
// trust supabase/schema.sql -- which is known to disagree with it.
// PostgREST publishes an OpenAPI document describing every exposed table with
// the real column types, so this is the server's own account of itself.
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o la clave en .env.local');
  process.exit(1);
}
console.log(`host: ${new URL(url).host}`);

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' },
});
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}
const spec = await res.json();

for (const [table, def] of Object.entries(spec.definitions ?? {})) {
  console.log(`\n== ${table} ==`);
  const required = new Set(def.required ?? []);
  for (const [col, meta] of Object.entries(def.properties ?? {})) {
    const parts = [meta.format ?? meta.type];
    if (meta.maxLength !== undefined) parts.push(`maxLength=${meta.maxLength}`);
    if (required.has(col)) parts.push('NOT NULL');
    const desc = (meta.description ?? '').replace(/\s+/g, ' ').trim();
    console.log(`  ${col.padEnd(22)} ${parts.join(' ')}${desc ? `   [${desc}]` : ''}`);
  }
}
