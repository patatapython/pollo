# Cutover runbook — pointing www.pollolist.app at the VPS

The application already runs on the VPS against its own Postgres, verified end
to end on 2026-07-23. No data moves: see the header of `db/schema.sql` for the
measured census behind that decision and who confirmed it.

Because nothing moves, two traps that a data migration would have created do not
exist here:

- **`SERVER_SECRET` does not need to match production.** It is the HMAC key
  behind `passphrase_lookup` (`lib/auth/passphrase.ts:87`), and a mismatch would
  normally lock every existing workspace out silently. With an empty target
  there is nothing to lock out. The secret generated for the VPS stays.
- **`db/migrations/001_ip_address_nullable_inet.sql` is never needed.** It exists
  to reshape a Supabase column that is being abandoned rather than converted.

What remains is the name, and the name is the only step that is hard to undo in
a hurry.

Steps marked **[manual]** need a dashboard or registrar login.

---

## 1. Environment: add nothing that changes behaviour

The Coolify application (`pollo`, UUID `k10xvndm2s5gqx9usbihs10j`) is configured
correctly for the cutover itself. One variable was added afterwards, and for a
different reason: `CRON_SECRET`, which was missing entirely and is what
`/api/cron/cleanup-rate-limits` needs — see `docs/platform-dependency-audit.md`.

For the cutover, resist the two tempting edits:

- **Do not delete the `NEXT_PUBLIC_SUPABASE_*` placeholders.** The driver is
  `postgres` and no data goes through Supabase, but
  `app/lists/[id]/page.tsx:51` subscribes to Supabase realtime through
  `createBrowserClient`, which throws when either variable is missing and takes
  the list page down with it — measured, not reasoned. The placeholders exist
  solely to stop that throw.
- **Do not bother replacing them with the real values either.** With real values
  the channel connects and receives nothing (RLS with no `anon` policy); with
  placeholders it fails DNS resolution. No realtime in either case, so the only
  difference is three lines of browser console noise — and step 4 deletes both
  variables outright. Rebuilding for that is work written to be thrown away.

Leave `DB_DRIVER`, `DATABASE_URL`, `JWT_SECRET` and `SERVER_SECRET` alone.

## 2. Lower the DNS TTL, and wait  [manual]

This has to happen *before* cutover day and is the step most easily skipped.

`www.pollolist.app` is a CNAME to Vercel with a TTL of **1799 seconds (~30
minutes)**. DNS is at the registrar: `dns1.registrar-servers.com` /
`dns2.registrar-servers.com` (Namecheap).

Lower that record's TTL to **60 seconds**, then wait at least one full old TTL —
in practice a few hours — before step 3.

Skip it and the switch is not a switch: for half an hour afterwards some
visitors still land on Vercel, sign in against Supabase, and write lists into a
database that is about to be decommissioned. Those writes are lost, and nothing
reports it.

## 3. Move the name, then wait for the certificate  [manual]

**The certificate cannot be obtained in advance.** An earlier draft of this
runbook claimed it could, and that was wrong. Let's Encrypt validates HTTP-01 by
resolving the name and connecting to whatever address DNS returns. While
`www.pollolist.app` resolves to Vercel, the challenge reaches Vercel and fails.
Issuance is only possible *after* the record points at the VPS. Avoiding that
window would need DNS-01 validation, which is not configured here.

So the order is:

1. In Coolify, add `www.pollolist.app` to the application's domains, so a
   Traefik router exists for that host before any traffic arrives.
2. At the registrar, repoint DNS to `37.59.123.31`. Two records, not one:
   - `www` — CNAME to Vercel today. Replace with an A record to the VPS.
   - apex `pollolist.app` — an A record to `216.198.79.1` today, serving a 307
     to `www`. It can stay on Vercel and keep redirecting, but moving it too is
     cleaner and removes the last reason to keep the Vercel project alive.
3. Expect TLS errors for the first seconds to couple of minutes while Traefik
   completes the challenge. Port 80 must stay reachable for this;
   `DOCKER-USER` allows it (`docs/vps-network-boundary.md`).

Repeated failed validations count against Let's Encrypt rate limits, so if the
certificate does not appear within a few minutes, stop and read Traefik's logs
rather than retrying in a loop.

### What actually happened, 2026-07-23

Done. `www.pollolist.app` is an A record to `37.59.123.31` and served from the
VPS, certificate issued by Let's Encrypt and valid until 2026-10-21. Verified on
the real domain: sign-in, list read, item create and delete, with the rows
confirmed by `psql` inside the container.

The failure the runbook now warns about was observed rather than predicted.
Adding the domain in Coolify while DNS still pointed at Vercel produced:

```
403 :: 64.29.17.1: Invalid response from
http://www.pollolist.app/.well-known/acme-challenge/75cAJ... : 404
```

`64.29.17.1` is Vercel. Let's Encrypt went exactly where DNS sent it. That is
the whole reason a certificate cannot be pre-issued for HTTP-01.

Traefik did not retry on its own after DNS moved. Redeploying the application
re-registered the router and issuance succeeded immediately. Prefer that over
restarting `coolify-proxy`: the proxy is shared with third-party sites on this
host, and bouncing it takes them down too.

### Unrelated noise in the same logs

Three domains left configured in Coolify fail ACME renewal every night and have
since 2026-07-18:

| Domain | Reason | Certificate |
|---|---|---|
| `chat.oxalis.fit` | `NXDOMAIN` | expired 2026-06-19 |
| `api-chat.oxalis.fit` | `NXDOMAIN` | expired 2026-06-19 |
| `oxalis.fit`, `www.oxalis.fit` | challenge answered by `76.76.21.21` (Vercel) | valid to 2026-09-26 |

None of them belong to pollo. They matter here only because a log full of nightly
ACME failures is a log in which a real failure does not stand out — which is very
nearly what happened during this cutover. Removing the dead domains would make
the next certificate problem visible on the first read.

## 4. After the name has moved

- Replace the dead Supabase realtime subscription with `LISTEN/NOTIFY` + SSE.
  Do **not** build Option A of `plans/007-report.md`; it was cancelled by this
  migration. Once done, both `NEXT_PUBLIC_SUPABASE_*` variables and the
  `@supabase/*` dependencies come out.
- Decommission Supabase and Vercel.
- Delete `supabase/schema.sql`, which describes a database that never existed.

## Rollback

Until step 4 begins, rollback is changing the DNS record back to Vercel. Nothing
in steps 1–3 modifies Supabase or Vercel, so the old stack stays ready to serve
for as long as the record says it should.

## Still open

- The Coolify app now tracks `main`, which is also what Vercel deploys, so a
  push goes to both until Vercel is decommissioned. Whether Coolify redeploys
  automatically is **unverified**: the API reports `is_auto_deploy_enabled:
  null`, so the only honest answer is that nobody has watched a push and
  checked. Deployments in this runbook are triggered explicitly.
- `.env.example` documents neither `DB_DRIVER` nor `DATABASE_URL`.
- `docs/vps-network-boundary.md` still carries one unexercised claim: firewall
  propagation across a real `docker.service` restart.
