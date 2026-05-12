# TimePost

A scheduled email delivery service built on **React 19** + **Cloudflare Workers** (Hono.js).

## Features

- **Rich Text Editing** — WYSIWYG editor (TipTap) with real-time side-by-side preview
- **Scheduled Sending** — Hour-precision scheduling, triggered automatically by Cloudflare Cron every hour
- **Contact Management** — Per-user contacts with tags and notes; pick recipients from contacts (multi-recipient support)
- **Email Templates** — Public (readable by all) or private; apply to editor in one click
- **Email Management** — Tabbed view for Drafts / Scheduled / Sent; edit content, reschedule, or cancel before sending
- **Authentication** — Email/password login, registration, logout, password reset
- **2FA** — TOTP (authenticator app), Passkey (WebAuthn biometrics), Email OTP
- **Admin Panel** — User management (roles, activate/deactivate, impersonate), system settings, email config, security settings
- **User Settings** — Language (zh/en), light/dark/system theme, timezone, session management
- **i18n** — Chinese and English, auto-detected from browser

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui, React Router v7, react-i18next, TipTap
- **Backend**: Cloudflare Workers, Hono.js, D1 (SQLite), KV, Cloudflare Cron
- **Auth**: JWT (access + refresh tokens, HttpOnly cookies), bcrypt, WebAuthn

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Wrangler

Edit `worker/wrangler.toml`:
- Set your `account_id`
- Create a D1 database and set `database_id`
- Create a KV namespace and set its `id`
- Set `JWT_SECRET` (random 32+ char string)
- Set `SETUP_SECRET` (random string for DB initialization)
- Set `TABLE_PREFIX` (optional, e.g. `timepost_`, leave empty for no prefix)

### 3. Initialize the database

```bash
# Deploy first, then call setup:

# Option 1: GET (secret in URL)
curl https://your-worker.workers.dev/api/setup/your-setup-secret

# Option 2: POST (secret in request header)
curl -X POST https://your-worker.workers.dev/api/setup \
  -H "X-Setup-Secret: your-setup-secret"
```

### 4. Start development

```bash
pnpm dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for signing JWTs (random 32+ char string) |
| `SETUP_SECRET` | Secret for calling the setup endpoint |
| `TABLE_PREFIX` | Optional prefix for all DB table names (e.g. `timepost_`) |

> For local development, configure these in `worker/wrangler.toml` under `[vars]`. For CI/CD, they are injected via GitHub Secrets/Variables.

## Deployment

### Manual deploy

```bash
pnpm deploy
```

### CI/CD auto deployment

The project includes GitHub Actions workflows:

- **Deploy** — Auto-deploy to Cloudflare Workers on push to `main`
- **Release** — Auto-create GitHub Release on `v*` tag push
- **Tag** — Manually trigger a semantic version tag

Configure the following Secrets and Variables in your GitHub repository:

| Type | Name | Description | Required |
|------|------|-------------|----------|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Yes |
| Secret | `PAT_TOKEN` | Personal Access Token for creating tags | No¹ |
| Secret | `JWT_SECRET` | JWT signing secret | Yes |
| Secret | `SETUP_SECRET` | Database initialization secret | Yes |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Yes |
| Variable | `D1_DATABASE_NAME` | D1 database name | Yes |
| Variable | `D1_DATABASE_ID` | D1 database ID | Yes |
| Variable | `KV_NAMESPACE_ID` | KV namespace ID | Yes |
| Variable | `TABLE_PREFIX` | Database table name prefix | No² |

¹ Only needed if you use the Tag workflow to trigger Releases.  
² Allows multiple projects to share a single D1 database via table name prefixes.

## Project Structure

```
├── .github/
│   └── workflows/          # GitHub Actions workflows
├── web/                    # Frontend project
│   └── src/
│       ├── components/     # Shared components
│       │   ├── contacts/   # ContactSelector, ContactForm
│       │   ├── editor/     # RichTextEditor (TipTap), EmailPreview
│       │   └── ui/         # shadcn/ui base components
│       ├── hooks/          # useAuth
│       ├── layouts/        # AppLayout (with navigation)
│       ├── locales/        # zh.json, en.json
│       ├── pages/
│       │   ├── admin/      # Admin panel
│       │   ├── auth/       # Login, register, 2FA, etc.
│       │   ├── contacts/   # Contact management
│       │   ├── emails/     # Email list, email editor
│       │   ├── home/       # Home page
│       │   ├── settings/   # User settings
│       │   ├── templates/  # Template management
│       │   └── about/      # About page
│       ├── lib/            # api, i18n, utils
│       └── types/          # Type definitions
├── worker/                 # Backend project
│   └── src/
│       ├── routes/         # auth, contacts, emails, templates, admin, me, setup
│       ├── core/           # Auth utilities, time helpers
│       ├── middleware/     # Auth, admin, rate limit
│       ├── db/
│       │   ├── queries/    # contacts, emails, templates, users, settings, twofa
│       │   └── schema.sql  # Database schema
│       └── services/       # Email sending, 2FA
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```
