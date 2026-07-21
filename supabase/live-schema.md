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

## The full DDL

`supabase/live-schema.sql` holds the real `pg_dump --schema-only` of the
`public` schema, taken the same day. That file, not this one and not
`schema.sql`, is what the VPS database should be built from. Supabase's own
internal schemas (`auth`, `storage`, `realtime`, `vault`, `graphql`,
`extensions`, `pgbouncer`) are excluded: they do not migrate.

Regenerate it with the database password from the dashboard
(Settings → Database), passed as `PGPASSWORD` rather than embedded in a URL:

```
PGPASSWORD=... pg_dump --schema-only --no-owner --no-privileges --schema=public \
  -h db.kokyxlixfrtcckzbhypn.supabase.co -U postgres -d postgres
```

### What the full dump added

`passphrase_lookup` **is** `UNIQUE` (`workspaces_passphrase_lookup_key`). The
access endpoint relies on this to guarantee at most one bcrypt verification per
candidate; it is now confirmed rather than assumed.

Indexes diverge further than the columns did. `schema.sql` declares five; the
database has twelve:

| Index | Status |
|---|---|
| `idx_rate_limit_ip_time` | **declared but does not exist** |
| `idx_rate_limit_ip_success` on `(ip_address, success, attempted_at)` | exists, undeclared — and it matches the access endpoint's actual query, which the declared one did not |
| `idx_rate_limit_attempted_at` | exists, undeclared |
| `idx_lists_workspace_position` | exists, undeclared |
| `idx_workspaces_tier` | exists, undeclared — indexes a dead column |
| `idx_premium_codes_code`, `idx_invite_codes_*` (3) | exist, undeclared — indexes on dead tables |
| `idx_workspaces_lookup` | exists, but **redundant**: the `UNIQUE` constraint already maintains an index on that column, so every write pays for two |

Triggers and functions match `schema.sql`, with one extra:
`update_subitems_updated_at`, a function for a `subitems` table that does not
exist. Dead code inside the database.

## Related finding: validation for columns that do not exist

`CreateItemSchema` and `UpdateItemSchema` accept, validate and trim `quantity`
and `notes` (`lib/validations/schemas.ts:67,72,92,97`), and four tests assert
this works. The `items` table has neither column, no API route reads either
field, and no component collects them. Dead validation surface with test
coverage, which reads as maintained rather than abandoned.
