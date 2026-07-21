# Integration suite

These tests talk to a real PostgreSQL. They are not part of `npm test`.

```sh
npm run test:db:up   # throwaway container on port 55432
npm run test:db
```

`TEST_DATABASE_URL` overrides the target. The suite applies `db/schema.sql` to
an empty schema before it starts, so running it also proves that file executes.

## Why a real database and not a test double

Everything worth checking in the repository layer is SQL semantics, and a
double returns whatever it is told to. The defect that shipped is the argument:
the rate limiter asked for `ip_address = NULL`, which in SQL is unknown rather
than false, so it counted nothing and let attempts through unbounded, silently.
Every mock in the world would have agreed the code was fine. A live PostgreSQL
disagrees in one line.

The same goes for the parts nothing else covers: triggers filling
`completed_at` and `updated_at`, `ON DELETE CASCADE` removing a list's items,
and the unique index on `passphrase_lookup` that keeps bcrypt to one run per
request.

## Why they are a separate command

`npm test` has to stay runnable on a machine with nothing installed, so the
unit suite must not require Docker.

Separate does not mean optional. The suite **fails** when no database answers —
it does not skip. A skipped suite reports success for work it never did, which
is the same failure as a test that cannot go red: it gets trusted exactly when
it has stopped checking anything.

## Verifying the tests still have teeth

They were checked by breaking the code on purpose and confirming each break
produced a targeted failure:

| Mutation | Result |
|---|---|
| `ip_address IS NULL` → `= NULL` | 2 failures, count drops to 0 — the original defect |
| window `>` → `>=` | boundary test fails |
| `findById` stops filtering by workspace | cross-workspace test fails |
| total taken from the page instead of a count | pagination tests fail |
| `toIso` returns the `Date` | response-shape test fails |
| `findByList` drops `is_completed` from the ordering | ordering test fails |
| no database reachable | whole suite fails, does not skip |

Do this again after changing the layer. A green suite is evidence only if it
was watched failing.
