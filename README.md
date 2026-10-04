# Dev Syndicate — website

The public website and lead pipeline for Dev Syndicate, a hackathon partner for colleges.
Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript.

```bash
npm install
cp .env.example .env.local   # optional in development — see below
npm run dev
```

| Script | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:setup` | Create the lead tables in `DATABASE_URL` (idempotent) |
| `npm run admin:hash -- "password"` | Generate `ADMIN_PASSWORD_HASH` |

## Structure

```text
app/
  (site)/            public pages: /, about, how-it-works, services, contact, privacy, terms
  admin/             protected lead dashboard: /admin, /admin/leads, /admin/leads/[id]
  api/leads/         contact form endpoint
  sitemap.ts, robots.ts, opengraph-image.tsx
components/          hero, sections, process, contact, admin, layout, navigation, footer, ui
lib/
  site.ts            company details (single source of truth)
  content.ts         shared marketing copy
  validation/lead.ts form schema — shared by the form and the API
  leads/             lead store: Postgres, or a JSON file in development
  email/             notification email + provider (SMTP / console)
  auth/              admin session (jose JWT in an httpOnly cookie)
proxy.ts             optimistic /admin gate (pages and actions re-check)
db/schema.sql        lead + notes tables
```

## How a request flows

Contact form → client validation → `POST /api/leads` → same-origin check, rate limit (per IP, in memory and
in the database), honeypot and minimum-fill-time checks → server validation → **stored** → **email
notification** to `CONTACT_EMAIL` (defaults to dsdevsyndicate@gmail.com), with Reply-To set to the requester.

If the lead is stored, the email is sent after the response. If storage isn't configured, the email is the
record and must succeed, or the visitor sees an error with direct contact details.

| | Development | Production |
| --- | --- | --- |
| Storage | `.data/leads.json` unless `DATABASE_URL` is set | Postgres via `DATABASE_URL` |
| Email | printed to the server log unless `SMTP_HOST` is set | SMTP via `SMTP_*` |

Configure **at least one** of `DATABASE_URL` or `SMTP_HOST` in production, ideally both.

## Admin

Set `SESSION_SECRET` (32+ chars) and `ADMIN_PASSWORD_HASH`, then sign in at `/admin/login`. Leads can be
searched, filtered by status and event type, moved through the pipeline
(New → Contacted → Meeting Scheduled → Proposal Sent → Negotiation → Won / Lost) and annotated with notes.
Admin pages are `noindex` and disallowed in robots.txt.

## Editing content

- Company details: `lib/site.ts`. Add real social profiles to `site.social` and the footer shows them.
- Copy: `lib/content.ts`.
- **Outcome metrics** (`outcomeMetrics`) have `value: null` until there are verified, cumulative numbers.
  Set a value and the homepage animates it in. Don't publish estimates.
- There is no testimonials, partner-logo or events section by design. Add them only with real, permissioned content.
