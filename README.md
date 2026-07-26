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

Then open:

```bash
http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` and add Supabase credentials when you are ready to connect the backend. Spotify variables enable the HoopTrust Rhythm playlist integration.

```bash
cp .env.example .env.local
```

### Spotify setup

1. Create an app in the Spotify Developer Dashboard.
2. Register `http://127.0.0.1:3000/api/spotify/callback` as its redirect URI.
3. Add the client ID and secret to `.env.local`.
4. Start the app and open `http://127.0.0.1:3000/rhythm`. Use `127.0.0.1`, not `localhost`, so the OAuth cookies and callback use the same host.

The integration requests only `playlist-modify-private`. Spotify tokens are encrypted in an HTTP-only cookie for this prototype. A production deployment should store encrypted refresh tokens in the authenticated user's server-side account record.

## Important pages

- `/` — Landing page
- `/signup` — Beta signup shell
- `/login` — Login shell
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
db/schema.sql         Supabase/Postgres schema draft
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
- Supabase schema draft
- HoopTrust Rhythm page with situation, mood, and goal selection
- Spotify OAuth, catalog search, explicit-content filtering, and private playlist creation

Not implemented yet:

- Real authentication
- Real database queries
- Real video file uploads
- Real email notifications
- Real recruiter approval workflow
- Real AI stat-tracking integration
- In-app Spotify playback and production-grade account token storage
- Payments

## Recommended next build step

Connect Supabase Auth and replace `lib/mock-data.ts` with database reads from Supabase tables.

## Safety notes

HoopTrust will likely involve high school athletes and minors. Before public launch, add:

- Parent/guardian consent workflow
- Strict profile visibility settings
- Recruiter account verification
- Video permission controls
- Data deletion workflow
- Terms of service and privacy policy
