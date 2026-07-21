# Live schema — what the deployed database actually contains

Captured 2026-07-21 from the running Supabase project by asking the server
itself, via `node supabase/live-schema.mjs`. Re-run that script rather than
trusting this file if it looks stale.

**`schema.sql` is not the DDL of the live database.** Rebuilding a new database
from it would silently produce a different schema than the one 137 real
workspaces are stored in. The divergences below were measured, not assumed.

## Divergences from `schema.sql`

| # | `schema.sql` says | The live database has | Consequence |
|---|---|---|---|
| 1 | `rate_limit_attempts.ip_address INET` (`:42`) | `character varying(45) NOT NULL` | `access/route.ts:24` writes the literal `'unknown'` when `x-forwarded-for` is absent. `INET` rejects it; `varchar(45)` accepts it. Rebuilding from `schema.sql` would turn every header-less request into a 500. |
| 2 | `rate_limit_attempts` has no `created_at` | `created_at timestamptz` exists | Matches `migrations/002_create_rate_limit_table.sql`, not `schema.sql`. |
| 3 | `workspaces` has 5 columns | also has `tier varchar(10)` and `premium_expires_at timestamptz` | Leftovers of the Stripe/premium system deleted from the code on 2026-02-27. Dead columns. |
| 4 | 4 tables | 6 tables: also `premium_codes` and `invite_codes` | Both feature sets were deleted from the code; the tables were never dropped. Dead tables. |

Conclusion: `migrations/` is closer to reality than `schema.sql`, but neither is
authoritative on its own.

## Columns, as reported by the server

```
workspaces            id uuid PK, passphrase_hash text NOT NULL,
                      passphrase_lookup text NOT NULL, tier varchar(10),
                      premium_expires_at timestamptz, created_at timestamptz,
                      updated_at timestamptz

lists                 id uuid PK, workspace_id uuid NOT NULL FK->workspaces.id,
                      name varchar(255) NOT NULL, position integer,
                      created_at timestamptz, updated_at timestamptz

items                 id uuid PK, list_id uuid NOT NULL FK->lists.id,
                      name varchar(500) NOT NULL, is_completed boolean,
                      completed_at timestamptz, position integer,
                      created_at timestamptz, updated_at timestamptz

rate_limit_attempts   id uuid PK, ip_address varchar(45) NOT NULL,
                      success boolean, attempted_at timestamptz,
                      created_at timestamptz

premium_codes         id uuid PK, code varchar(16) NOT NULL,
                      stripe_session_id varchar(255), used_at timestamptz,
                      redeemed_by_workspace_id uuid FK->workspaces.id,
                      created_at timestamptz

invite_codes          id uuid PK, list_id uuid NOT NULL FK->lists.id,
                      code varchar(12) NOT NULL, expires_at timestamptz NOT NULL,
                      used_at timestamptz, created_at timestamptz
```

## What this capture does NOT establish

PostgREST reports columns, types, nullability and key relationships. It says
nothing about defaults, indexes, unique constraints, triggers, functions or
publications. `passphrase_lookup` being `UNIQUE` — which the access endpoint
relies on to guarantee at most one bcrypt verification per candidate — is
therefore still unconfirmed against the live database.

**Before migrating data to the VPS, take a real `pg_dump --schema-only`.** That
needs the database password from the Supabase dashboard (Settings → Database),
which is not in `.env.local`:

```
pg_dump --schema-only --no-owner \
  "postgresql://postgres:<password>@db.kokyxlixfrtcckzbhypn.supabase.co:5432/postgres" \
  > supabase/live-schema.sql
```

## Related finding: validation for columns that do not exist

`CreateItemSchema` and `UpdateItemSchema` accept, validate and trim `quantity`
and `notes` (`lib/validations/schemas.ts:67,72,92,97`), and four tests assert
this works. The `items` table has neither column, no API route reads either
field, and no component collects them. Dead validation surface with test
coverage, which reads as maintained rather than abandoned.
