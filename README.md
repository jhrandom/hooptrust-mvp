# HoopTrust MVP

HoopTrust is a starter MVP for an AI-verified basketball recruiting platform. The prototype connects four core product ideas:

1. Player profile management
2. Game video / evidence submission
3. Stat verification workflow
4. Recruiter search and contact requests
5. HoopTrust Rhythm music recommendation framework

This is not yet a production platform. It is a launchable coding scaffold that a founder, developer, or technical partner can use to begin building the real beta product.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-ready architecture
- Zod for API validation
- Mock data for the first prototype

## Getting started

```bash
npm install
npm run dev
```

Then open the URL printed by Next.js. For a deployed environment, use your public HTTPS domain.

```bash
https://your-domain.example
```

## Environment variables

Copy `.env.example` to `.env.local` and add Supabase credentials when you are ready to connect the backend. Spotify variables enable the HoopTrust Rhythm playlist integration.

```bash
cp .env.example .env.local
```

### Supabase setup

1. Create a Supabase project and copy its Project URL and publishable key.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` to `.env.local`. Add the server-only `SUPABASE_SECRET_KEY` when deploying persistent Spotify sessions.
3. Run `npx supabase init`, `npx supabase login`, and `npx supabase link --project-ref YOUR_PROJECT_REF`.
4. Apply the tracked schema with `npx supabase db push`.
5. In Supabase Auth URL Configuration, set the Site URL to your public domain and add `https://your-domain.example/auth/callback` as a redirect URL.
6. Restart the development server after changing environment variables.

For SSR-safe email confirmation, open **Authentication → Email Templates → Confirm signup** in Supabase and use this link in the template:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirm email address
</a>
```

This token-hash route does not depend on a browser-specific PKCE verifier.

Authentication remains in demo mode when the Supabase variables are absent. Once configured, signup, email confirmation, login, logout, SSR session refresh, and dashboard authentication activate automatically.

### Spotify setup

1. Create an app in the Spotify Developer Dashboard.
2. Register `https://your-domain.example/api/spotify/callback` as its redirect URI.
3. Add the client ID and secret to `.env.local`.
4. Open `https://your-domain.example/rhythm`. The app derives its callback from `NEXT_PUBLIC_SITE_URL` unless `SPOTIFY_REDIRECT_URI` explicitly overrides it.

The integration requests only `playlist-modify-private`. Spotify tokens are encrypted before storage and the browser receives an opaque session cookie. Deployed environments use the server-only `spotify_sessions` Supabase table when `SUPABASE_SECRET_KEY` is configured; local development falls back to an ignored `.data` file.

## Important pages

- `/` — Landing page
- `/signup` — Supabase account signup
- `/login` — Supabase account login
- `/dashboard/player` — Player dashboard
- `/dashboard/recruiter` — Recruiter search portal
- `/rhythm` — HoopTrust Rhythm private Spotify playlist builder
- `/players/tyler-kim` — Sample recruiter-ready player profile
- `/upload` — Game/video upload shell
- `/verify-stats` — Stat verification queue
- `/admin` — Admin dashboard

## Project structure

```text
app/                  Next.js routes and screens
components/           Reusable UI components
lib/                  Types, utilities, mock data, Supabase client shell
supabase/migrations/  Versioned Supabase/Postgres schema
docs/                 Build plan, API contract, user flows
```

## Current implementation status

Implemented:

- Static UI prototype
- Mock player data
- Mock games and stat lines
- Verification badges
- Player profile page
- Recruiter search page
- Admin dashboard
- API route shells
- Versioned Supabase migration with profile trigger and starter RLS policies
- Supabase SSR clients, auth callback, signup, login, logout, and dashboard guards
- Persistent player profiles, evidence and stat submissions
- Recruiter applications, approval, search, saved players, and contact requests
- Admin stat verification decisions with audit records
- HoopTrust Rhythm page with situation, mood, and goal selection
- Spotify OAuth, catalog search, explicit-content filtering, and private playlist creation

Not implemented yet:

- Real video file uploads
- Real email notifications
- Real AI stat-tracking integration
- In-app Spotify playback and production-grade account token storage
- Payments

## Recommended next build step

Apply the Supabase migration, then replace `lib/mock-data.ts` with authenticated database reads.

## Safety notes

HoopTrust will likely involve high school athletes and minors. Before public launch, add:

- Parent/guardian consent workflow
- Strict profile visibility settings
- Recruiter account verification
- Video permission controls
- Data deletion workflow
- Terms of service and privacy policy
