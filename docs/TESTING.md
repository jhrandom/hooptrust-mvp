# Automated testing

The suite is intentionally layered so fast checks run often while database and browser tests remain isolated from production.

## Commands

```bash
npm test                 # unit and mocked route integration tests
npm run test:coverage    # tests plus coverage thresholds
npm run test:e2e         # Chromium desktop and mobile smoke tests
npx supabase start       # disposable local database
npm run test:db          # migration, schema, function, and RLS structure checks
npm run test:all         # complete local quality gate
```

Install the Playwright browser once:

```bash
npx playwright install chromium
```

Database tests require Docker because the Supabase CLI runs the local stack in containers. Never point automated mutation tests at the production Supabase project.

## Coverage

Vitest covers basketball calculations and consistency rules, safe evidence URLs, Rhythm recommendation branches, utility behavior, contact-request authorization/rate-limit branches, highlight authorization, and Spotify playlist success/failure behavior.

Playwright checks public navigation, authentication forms, legal pages, Rhythm interaction, and mobile overflow. These smoke tests do not create accounts or mutate real data.

The pgTAP suite validates the hardening migration’s tables, columns, restricted public view, security functions, and RLS policy presence. Expand it with role-by-role behavioral RLS tests whenever a new database workflow is added.

## GitHub Actions

`.github/workflows/quality.yml` runs application, local-database, and browser jobs on pushes to `main` and pull requests. Add these repository secrets if the production build needs configured Supabase values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not add the Supabase secret key or Spotify client secret unless a future isolated test job explicitly requires them.
