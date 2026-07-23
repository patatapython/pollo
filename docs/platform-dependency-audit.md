# What the old platform still does for us

Production moved to the VPS on 2026-07-23 while Vercel and Supabase stayed up as
the rollback. That is the safe posture, and it hides a specific danger: anything
the old platform was quietly doing on our behalf is still working, so its
absence on the VPS produces no symptom until the day Vercel is switched off —
by which point the evidence of what it did is gone too.

This file is the inventory. It exists because the first such dependency was not
found by auditing; it was found by accident, reading `vercel.json` for an
unrelated reason. One accident is not a method.

Every row is either **replaced**, **declared unnecessary**, or **open**. Vercel
does not get switched off while a row is open.

## Findings

| What | Where it lived | Status |
|---|---|---|
| Daily cleanup of `rate_limit_attempts` | `vercel.json` cron, 03:00, hitting `/api/cron/cleanup-rate-limits` | **replaced** — Coolify scheduled task `cleanup-rate-limits`, same schedule, same endpoint over loopback |
| `CRON_SECRET` | Vercel environment only | **replaced** — set on the Coolify app. It was missing there, so the endpoint answered 500 to every call |
| Apex redirect `pollolist.app` → `www` | Vercel domain configuration, serving a 307 | **open** — still served by Vercel. The apex A record points at `216.198.79.1` and nothing on the VPS answers for that name |
| `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*` | both platforms | **declared unnecessary** on the VPS once the realtime subscription is replaced; the data path already does not use them under `DB_DRIVER=postgres` |
| Row-level security policies | Supabase database | **declared unnecessary** — replaced by non-exposure, see `docs/vps-network-boundary.md` |
| Supabase realtime (`postgres_changes`) | Supabase | **open** — dead in both places (RLS with no `anon` policy). To be replaced by `LISTEN/NOTIFY` + SSE |
| TLS certificates | Vercel, automatic | **replaced** — Traefik + Let's Encrypt, see `docs/vps-cutover.md` |
| Database backups | Supabase, managed | **replaced** — nightly dump on the VPS with a restore drill that compares against the live source |

## Not yet enumerated

These need a dashboard login and have not been checked. Until they are, the
table above is incomplete and says so.

- **Vercel environment variables.** The full set configured there has never been
  compared against what the VPS has. `CRON_SECRET` was found by reading the
  code, not by reading Vercel, and there may be more of the same shape.
- **Vercel project settings**: deployment protection, rewrites, redirects
  beyond the apex, image optimization domains.
- **Supabase scheduled jobs** (`pg_cron`, edge functions, webhooks). None are
  known, and none have been ruled out.

## The guard that now exists

For environment variables specifically, the class of bug is closed rather than
the instance. `lib/config/env.ts` declares every variable the application reads,
and `__tests__/lib/config/env-declared.test.ts` walks the source and fails if
the two ever diverge — in either direction. A variable read but undeclared fails
the suite; so does one declared but read by nobody.

That is what stops the next `CRON_SECRET`. It does not stop a missing *schedule*
or a missing *DNS record*, which is why the rest of this file is a list and not
a test.

## Still missing: nobody would notice if the cleanup stopped

The scheduled task is configured and the endpoint works, but the failure mode
that produced this document is not closed. If the Coolify task is disabled,
mis-typed, or silently fails, `rate_limit_attempts` grows and nothing reports
it — exactly the situation the Vercel cron was in for the hours after cutover.

Closing that means making the *outcome* observable rather than the job:
the oldest surviving row in `rate_limit_attempts` should never be more than a
few days past the retention window, and something should say so when it is.
Until that exists, this row is monitored by remembering, which is not
monitoring.
