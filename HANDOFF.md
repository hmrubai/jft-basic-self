# Project Handoff Guide

**Project:** JFT Mock Exam Platform  
**Prepared by:** Sara Sugita (`sarasugita`)  
**Date:** 2026-05-19

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Architecture Overview](#2-architecture-overview)
3. [Services and Ownership Transfer Plan](#3-services-and-ownership-transfer-plan)
4. [Transfer Runbook (Safe Order)](#4-transfer-runbook-safe-order)
5. [Environment Variables and Secrets](#5-environment-variables-and-secrets)
6. [Local Development Setup](#6-local-development-setup)
7. [Deployment and Database Change Process](#7-deployment-and-database-change-process)
8. [Post-Transfer Smoke Test](#8-post-transfer-smoke-test)
9. [Key Design Decisions and Security Notes](#9-key-design-decisions-and-security-notes)
10. [Contact](#10-contact)

---

## 1. What This Project Is

A mock exam platform for the JFT-Basic test (Japanese language proficiency test for foreign workers).

- **Student app**: test-takers log in, take mock exams, and review results
- **Admin app**: school administrators manage students, question sets, and analytics

---

## 2. Architecture Overview

```text
monorepo (jft-basic)
├── apps/
│   ├── student/        Vite + React SPA  →  Vercel project (student)
│   └── admin/          Next.js app       →  Vercel project (admin)
├── packages/           Shared code
└── supabase/
    ├── functions/      Supabase Edge Functions (Deno)
    └── sql/            SQL files (schema + phase migrations)
```

### Edge Functions currently implemented (15)

| Function | Purpose |
|---|---|
| `invite-students` | Creates student accounts and returns temp passwords |
| `delete-student` | Removes a student account |
| `set-student-password` | Sets or resets a student's password |
| `reissue-temp-password` | Reissues a temporary password |
| `update-student-email` | Updates a student's email |
| `manage-schools` | CRUD for school records |
| `manage-school-admins` | Manages school admin users |
| `get-admin-school-options` | Returns school list for admin switching |
| `create-question-set` | Creates a new question set |
| `upload-question-set-version` | Uploads/parses CSV + assets for new version |
| `validate-question-set-upload` | Validates CSV/assets before import |
| `update-question-set-metadata` | Updates question set metadata |
| `archive-question-set` | Archives or hard-deletes question set family |
| `set-question-set-visibility` | Updates global/restricted visibility |
| `record-audit-log` | Writes audit events |

Notes:
- `supabase/functions/student-login/` directory exists but currently has no `index.ts` implementation.
- Sensitive operations use service-role server-side in Edge Functions.

---

## 3. Services and Ownership Transfer Plan

| Service | Current Owner | Resource |
|---|---|---|
| GitHub | `sarasugita` | `https://github.com/sarasugita/jft-basic` |
| Vercel (student) | `sarasugita` | See Vercel dashboard |
| Vercel (admin) | `sarasugita` | See Vercel dashboard |
| Supabase | `sarasugita` | See Supabase dashboard |

### Access to keep for Sara after transfer

- **GitHub**: Org **Member** + repository access (`Maintain` or `Admin`)
- **Vercel**: Team member (`Admin` recommended during stabilization)
- **Supabase**: `Administrator` (or `Owner` during stabilization window)

Reason:
- Vercel + GitHub org integrations are smoother when the user is an org member (not only outside collaborator).

---

## 4. Transfer Runbook (Safe Order)

Recommended window:
- Execute during low-traffic hours (evening/night)
- Reserve a 60–120 minute window with both parties present
- Freeze merges and content updates for the duration

Order rationale:
- **Supabase first** — independent of the other two, zero user-facing risk
- **GitHub second** — no production impact; Vercel serves already-built assets
- **Vercel last** — highest risk (live user traffic); do after other transfers are confirmed clean

### A. Pre-flight (before transfer day)

- [ ] Confirm partner created GitHub org, Vercel team, Supabase org
- [ ] Invite Sara into all three destinations
- [ ] Enforce MFA/2FA in all orgs/teams
- [ ] Document current production URLs/domains
- [ ] Take database backup and confirm restore path

### B. Supabase transfer (lowest risk — do first)

- [ ] In source org project: `Project Settings → General → Transfer project`
- [ ] Confirm pre-requirements before transfer:
  - no active GitHub integration on this Supabase project
  - no log drains configured
  - no project-scoped roles tied to this project (Team/Enterprise plan)
- [ ] Transfer to partner Supabase organization
- [ ] Re-invite Sara under `Settings → Team` (Administrator role)
- [ ] Verify edge function secrets are intact: `Edge Functions → Manage secrets`

Notes:
- Transfer is org-to-org only (not a region migration — project URL/keys do not change).
- Billing usage may be split across source/target org depending on billing cycle timing.
- Apps continue working without interruption — Supabase URL and keys are unchanged.

### C. GitHub transfer (no user-facing risk)

- [ ] `Repository Settings → Danger Zone → Transfer ownership`
- [ ] Transfer `sarasugita/jft-basic` to partner GitHub org
- [ ] New owner re-invites Sara as collaborator (Maintain or Admin)
- [ ] Both parties update local remote URL:
  `git remote set-url origin https://github.com/<partner-org>/jft-basic`
- [ ] Confirm branch protections and any Actions secrets are still in place

Note: Vercel continues serving the already-built apps — no downtime. Auto-deploy from Git will be temporarily broken until Step D reconnects it.

### D. Vercel transfer (highest risk — do last, verify immediately)

- [ ] In each project: `Settings → General → Transfer Project`
- [ ] Transfer both projects (student + admin) to partner Vercel team
- [ ] Immediately after transfer, check both production URLs are still responding
- [ ] Reconnect the GitHub repository in Vercel Git settings (required after GitHub transfer)
- [ ] Verify all environment variables are present (most are copied, but double-check)
- [ ] Trigger a fresh deployment for both projects
- [ ] Smoke test both apps (see Section 8)

Notes from Vercel docs:
- Most environment variables are copied on transfer.
- Variables defined directly in `vercel.json` `env` / `build.env` are exceptions — must be reconfigured manually.
- Domains/aliases transfer by delegation (DNS change not required unless using a custom domain on a new team).

### E. Post-transfer security hardening (same day)

- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` in this exact order to avoid downtime:
  1. Update the new value in **Vercel env vars** (both projects) first
  2. Trigger a fresh deployment so the new value is live
  3. Then rotate the key in **Supabase Dashboard → API settings**
  4. Verify Edge Functions still respond (smoke test Section 8)
- [ ] Rotate any other sensitive tokens (third-party API keys, webhook secrets)
- [ ] Remove old owner's personal tokens from any CI/CD or external integrations
- [ ] Keep Sara with elevated access for 1–2 weeks, then reduce if desired

---

## 5. Environment Variables and Secrets

Important:
- Environment variables are not committed to git.
- Share values via one-time secure channel (for example, OneTimeSecret).

### Student app (`apps/student`) - Vercel project env

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

### Admin app (`apps/admin`) - Vercel project env

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `NEXT_PUBLIC_STUDENT_BASE_URL` | Student app base URL |

### Supabase Edge Functions secrets

Current code references:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Hosted Supabase provides default project keys, but confirm the above values are available after transfer because functions explicitly read these names.

### Local development env files

`apps/student/.env.local`
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`apps/admin/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STUDENT_BASE_URL=
```

---

## 6. Local Development Setup

Requirements:
- Node.js 18+
- npm
- Supabase CLI

```bash
# repo root
npm install

# student app (http://localhost:5173)
npm run dev:student

# admin app (http://localhost:3000)
npm run dev:admin
```

Create `.env.local` files before running dev servers (Section 5).

---

## 7. Deployment and Database Change Process

### Frontend deploy

- Pushing to `main` triggers Vercel deployment for both apps (if Git integration is connected).

### Edge Functions deploy

```bash
supabase functions deploy <function-name>
```

Example:
```bash
supabase functions deploy update-student-email
```

### Database changes (important)

Do **not** assume `supabase db push` alone is sufficient for this repo.

This project uses SQL files in `supabase/sql/` with ordered phase migrations.  
Before applying changes to production:

- [ ] Compare current production state with `supabase/sql/` files
- [ ] Apply missing SQL in the intended order
- [ ] Use docs for ordering baseline:
  - `docs/multi-school-rbac.md`
  - `supabase/README.md`

---

## 8. Post-Transfer Smoke Test

- [ ] Student login works
- [ ] Student can start/submit test
- [ ] Student results page loads (check partial-score matrix renders correctly)
- [ ] Admin login works
- [ ] Admin can invite a student (check email is received)
- [ ] Admin student password reset flow works
- [ ] Admin student delete flow works
- [ ] Super admin school management works
- [ ] Question set CSV validate/upload/version flow works
- [ ] Audit logs are written (`record-audit-log` function)
- [ ] Push a commit to `main` → Vercel auto-deploys both apps

---

## 9. Key Design Decisions and Security Notes

- Elevated admin operations run in Edge Functions; browser never gets service-role keys.
- Several functions use `verify_jwt = false` and perform auth checks in function code. Do not bypass those checks.
- Super-admin scoped mode relies on `x-school-scope` header and school-scoped auth behavior.
- Student app is SPA and requires rewrite rule in `apps/student/vercel.json`.

---

## 10. Contact

**Sara Sugita**  
GitHub: [@sarasugita](https://github.com/sarasugita)  
Email: 1231sara1231@gmail.com

Please reach out for transition support, especially during transfer day and the first stabilization week.
