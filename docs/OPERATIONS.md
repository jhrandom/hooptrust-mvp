# HoopTrust operations checklist

The application now includes a health endpoint at `/api/health`, an email-notification outbox, account deletion tooling, database rate limits, and a retention function. The following production services still require configuration outside the repository.

## Monitoring

- Configure an uptime monitor to request `https://YOUR_DOMAIN/api/health` every 5 minutes and alert on non-200 responses.
- Connect a server error-monitoring provider to the hosting platform. Do not send passwords, access tokens, minor contact details, or raw form bodies to logs.
- Review Supabase database and authentication logs regularly.

## Backups

- Enable Supabase automated backups and point-in-time recovery for the production project.
- Perform a documented restore drill before launch and at least quarterly.
- Back up uploaded evidence according to the organization’s retention policy. A database backup alone does not back up third-party video links.

## Email delivery

Database triggers add pending messages to `public.notification_outbox`. Deploy a trusted server-side worker or Supabase Edge Function that:

1. reads pending rows using the Supabase secret key;
2. sends the matching template through the configured transactional email provider;
3. marks successful rows `sent` with `sent_at`, or increments `attempts`;
4. retries transient failures and alerts after repeated failures.

Never expose the Supabase secret key in client-side environment variables.

## Retention

Schedule `select public.apply_retention_policy();` daily with Supabase Cron or another trusted scheduler. This removes expired Spotify sessions, old rate-limit buckets, profile-view analytics older than two years, and sent outbox entries older than 90 days. Have legal counsel approve these periods before production.

## Security and privacy

- Apply all migrations before deploying application code.
- Keep `VIDEO_ALLOWED_HOSTS` limited to vetted HTTPS media providers.
- Rotate Supabase and Spotify secrets if they are ever committed or disclosed.
- Review recruiter verification when it expires.
- Have counsel review `/privacy`, `/terms`, and `/safety`, especially the minor-consent and data-retention language.
- Restrict administrator accounts and require authenticator-app MFA operationally.

## Release

Run `npm ci`, `npm run lint`, and `npm run build`. Verify sign-up, password reset, evidence submission, recruiter approval, contact consent, permanent deletion, and the health endpoint in a staging environment before production.
