<div align="center">

<img src="public/logo_solo.png" alt="Pollo" width="140" />

# POLLO

### The list app that doesn't know who you are.

**No accounts. No email. No password. Just five words.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Self-hosted](https://img.shields.io/badge/Self--hosted-Coolify_on_a_VPS-6B16ED?style=flat-square)](https://coolify.io)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![MIT License](https://img.shields.io/badge/License-MIT-f0c040?style=flat-square)](LICENSE)

<br/>

[Lee esto en Español](README.es.md) · [Live Demo](https://pollolist.app) · [Report Bug](https://github.com/patatapython/pollo/issues)

</div>

---

## Screenshots

<div align="center">

<table>
  <tr>
    <td align="center" width="25%">
      <img src="img/cp1.png" width="180" alt="Access screen" /><br/>
      <sub><b>No account needed</b><br/>Open the app, get five words, you're in.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp2.png" width="180" alt="Your space is ready" /><br/>
      <sub><b>Your passphrase</b><br/>Five words. The only key to your space.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp3.png" width="180" alt="Dashboard with lists" /><br/>
      <sub><b>Your lists</b><br/>All in one place, shared in real time.</sub>
    </td>
    <td align="center" width="25%">
      <img src="img/cp4.png" width="180" alt="List with items" /><br/>
      <sub><b>Check things off</b><br/>Works offline, syncs when back online.</sub>
    </td>
  </tr>
</table>

</div>

---

## The idea

Most apps make you create an account before you can do anything useful. They ask for your email, make you verify it, pick a password, accept their privacy policy, and by then you've forgotten what you wanted to write down.

Pollo works differently.

You get **five random words**. That's your account. That's your password. That's your shared space. No registration. No data about you. Open the app, write your list, close it. Come back tomorrow with your five words and everything is there.

```
horse · rain · table · fire · sun
```

That's it. That's your workspace.

### Two things that are equally easy

**Using it yourself:**
Enter your five words → you're in. Every device, every time.

**Sharing with someone:**
Give them your five words → they're in the exact same space. Same lists. Real time. No invites, no accounts, no permissions. Just words.

This makes Pollo genuinely useful for couples, roommates, families, or small teams who want shared lists without the overhead of collaboration software.

---

## How the passphrase system works

This is the technical heart of the project.

### Generation

Passphrases are generated from a curated dictionary of **7,776 Spanish words** sourced from [dadoware-bonito-es](https://github.com/mir123/dadoware-bonito-es) by [@mir123](https://github.com/mir123), a Spanish Diceware wordlist based on the EFF standard. Five words are selected using `crypto.getRandomValues()` with rejection sampling to eliminate modulo bias:

```typescript
function getSecureRandomIndex(max: number): number {
  const bytesNeeded = Math.ceil(Math.log2(max) / 8);
  const maxValid = Math.pow(256, bytesNeeded);
  const limit = maxValid - (maxValid % max);

  while (true) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(bytesNeeded));
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) | randomBytes[i];
    }
    if (value < limit) return value % max;
  }
}
```

**Entropy:** ~12.9 bits per word × 5 words = **~64.5 bits total**: 7,776⁵ ≈ 28 trillion combinations. Brute force is not a realistic attack.

### Storage: two hashes, one secret, zero plaintext

The passphrase is **never stored in plaintext**. Two derived values are computed and stored:

| Field | Algorithm | Purpose |
|---|---|---|
| `passphrase_hash` | bcrypt (12 rounds) | Verification, slow by design |
| `passphrase_lookup` | HMAC-SHA256 | O(1) indexed database lookup |

The lookup hash is the key design insight. bcrypt is non-deterministic: you can't `WHERE hash = bcrypt(input)`. That would be a full table scan. HMAC is deterministic: same input + same secret = same output, always. So login is a single indexed query.

```mermaid
flowchart LR
    A["User types\n'horse rain\ntable fire sun'"]
    A --> B["HMAC-SHA256\n+ SERVER_SECRET"]
    A --> C["bcrypt.compare\n+ stored hash"]
    B --> D[("Indexed\nDB query")]
    D --> E["Find workspace"]
    C --> F["Verify identity"]
    E & F --> G["Access granted"]
```

`SERVER_SECRET` never touches the database. A leaked database gives an attacker bcrypt hashes (expensive to crack) and HMAC digests (useless without the server secret). **Two layers, two secrets, zero useful leakage.**

---

## Features

| | |
|---|---|
| **No-account auth** | Five-word passphrase, cryptographically generated |
| **Multiple lists** | Unlimited lists and items per workspace |
| **Offline support** | Works without internet, syncs on reconnect |
| **Recovery kit** | Export passphrase as text file or image |
| **Bilingual** | Full Spanish / English interface with language toggle |
| **Mobile-first** | Fully responsive and touch-friendly; install it as a PWA from your browser |
| **Rate limiting** | IP-based brute force protection |
| **No tracking** | No analytics, no cookies beyond the session |

**Not there yet: live sync between devices.** The first version relied on the hosted database's change subscriptions, and they never delivered an event: the subscription connected, but row-level security had no policy for anonymous clients. It is being rebuilt on PostgreSQL `LISTEN/NOTIFY` with Server-Sent Events. Until then, changes from another device show up when the list is reloaded.

---

## Tech stack

[![Next.js](https://img.shields.io/badge/Next.js_16_(App_Router)-000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-FF6B35?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Coolify](https://img.shields.io/badge/Coolify_+_Traefik-6B16ED?style=for-the-badge)](https://coolify.io)

Auth layer is fully custom: **JWT** (`jose`) + **bcrypt** (`bcryptjs`) + **HMAC-SHA256** (Web Crypto API). No auth library dependencies.

Production runs on a self-hosted VPS: the app in a container managed by Coolify, TLS through Traefik with Let's Encrypt, and its own PostgreSQL that is not reachable from the internet. Data access goes through a repository layer (`lib/repositories`) built on `postgres.js`.

---

## Security

| Concern | Solution |
|---|---|
| Passphrase storage | bcrypt cost factor 12, intentionally slow |
| Passphrase lookup | HMAC-SHA256 with server-side secret |
| Session | JWT HS256, httpOnly cookie, 24h expiry |
| XSS | httpOnly cookies: JS can't read the session token |
| CSRF | SameSite=lax |
| Clickjacking | `X-Frame-Options: DENY` |
| Brute force | IP-based rate limiting |
| Transport | HSTS 2-year max-age |
| Database exposure | Not reachable from the internet: a default-deny firewall in Docker's own chain, reinstalled on every boot ([details](docs/vps-network-boundary.md)) |
| Secrets | Validated at startup: the app refuses to boot if any is missing |

---

## Database schema

<details>
<summary>Show schema</summary>

```sql
workspaces
  id                UUID PRIMARY KEY
  passphrase_hash   TEXT          -- bcrypt(passphrase, 12 rounds)
  passphrase_lookup TEXT UNIQUE   -- HMAC-SHA256(passphrase, SERVER_SECRET)
  created_at        TIMESTAMPTZ

lists
  id                UUID PRIMARY KEY
  workspace_id      UUID → workspaces
  name              VARCHAR(255)
  position          INT

items
  id                UUID PRIMARY KEY
  list_id           UUID → lists
  name              VARCHAR(500)
  is_completed      BOOLEAN
  completed_at      TIMESTAMPTZ   -- set and cleared by trigger
  position          INT

rate_limit_attempts
  ip_address        INET
  success           BOOLEAN
  attempted_at      TIMESTAMPTZ   -- pruned after 7 days by a daily job
```

Indexes on every FK and lookup field. `passphrase_lookup` has a unique index, so login is always a single indexed query. The full DDL, with the reasoning behind each choice, is in [`db/schema.sql`](db/schema.sql).

</details>

---

## Running locally

**Prerequisites:** Node.js 20.9+ and Docker.

```bash
git clone https://github.com/patatapython/pollo.git
cd pollo
npm install

# PostgreSQL 16 in Docker, on port 55432
npm run test:db:up
docker exec pollo-pg-dev sh -c 'until pg_isready -h 127.0.0.1 -q; do sleep 1; done'
docker exec -i pollo-pg-dev psql -U postgres -d pollo -v ON_ERROR_STOP=1 < db/schema.sql

cp .env.example .env.local   # then fill in your secrets
npm run dev
```

<details>
<summary>Environment variables (same as <code>.env.example</code>)</summary>

```env
# Required
DB_DRIVER=postgres
DATABASE_URL=postgres://postgres:dev@127.0.0.1:55432/pollo
JWT_SECRET=minimum-32-character-random-string
SERVER_SECRET=minimum-32-character-random-string

# Optional: enables the daily cleanup endpoint /api/cron/cleanup-rate-limits
CRON_SECRET=random-string

# Temporary: still read by the old realtime client (lib/supabase/realtime.ts),
# and the list page fails to load without them. They go away with the SSE rewrite.
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Generate secrets: `openssl rand -base64 48`

`DB_DRIVER` has to be written down on purpose. The app does not guess the database from whichever variables happen to be set, so a leftover variable can never switch it silently to another one.

</details>

---

## Architecture decisions

<details>
<summary>Why no user accounts?</summary>

User accounts mean email addresses, which means a database worth attacking. Passphrase workspaces mean: no PII stored, nothing useful to leak, zero friction on first use.

The tradeoff is deliberate: lose your five words, lose your workspace. No "forgot password" because there's no email. Feature, not bug.

</details>

<details>
<summary>Why HMAC for lookup instead of bcrypt?</summary>

bcrypt is non-deterministic: two hashes of the same input are different values. `WHERE hash = bcrypt(input)` is impossible. You'd need a full table scan.

HMAC-SHA256 is deterministic. Compute it at login time, query `WHERE lookup = hmac(input, secret)` on an indexed column. Single query, constant time, scales indefinitely.

The HMAC secret never touches the database. Full DB access + no server secret = no passphrases recovered.

</details>

<details>
<summary>Why a repository layer?</summary>

Pollo started on Supabase and moved to its own PostgreSQL on a VPS. Routes never talk to a database client: they ask `lib/repositories` for workspaces, lists, items and rate limits, and `DB_DRIVER` chooses the implementation. That made the move a configuration change backed by tests, not a rewrite, and the old implementation stays as the rollback path until the previous platform is switched off.

</details>

<details>
<summary>Why Zustand instead of Redux?</summary>

State is small and server-fetched. Zustand's minimal API (no boilerplate, no providers, no actions/reducers split) matches the project's philosophy: minimum necessary, done well.

</details>

---

## Tests

```bash
npm test             # unit and API tests
npm run test:ui      # Vitest browser UI
npm run test:db:up   # start the PostgreSQL 16 test container
npm run test:db      # integration tests against that real database
```

Unit and API tests cover passphrase crypto, session lifecycle, API validation and failure paths, startup checks, and a scan that fails if the code reads an environment variable nobody declared. The integration suite applies `db/schema.sql` to an empty database and runs every PostgreSQL repository against it, because a test double would happily confirm a rate limiter that counts nothing.

---

## Contributing

Portfolio project, but issues and PRs are welcome. For security issues, use a private issue.

---

## License

MIT, see [LICENSE](LICENSE).

---

<div align="center">

<sub>Built with the belief that software doesn't need to know who you are to be useful.</sub>

</div>
