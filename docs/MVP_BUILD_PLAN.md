# HoopTrust MVP Build Plan

## Build order

1. Static prototype pages using mock data
2. Supabase Auth setup
3. Database schema migration
4. Player profile CRUD
5. Video link submission
6. Stat submission
7. Admin verification workflow
8. Recruiter application and approval
9. Recruiter search filters
10. Contact request workflow

## Current scaffold status

This starter code includes:

- Landing page
- Player dashboard
- Recruiter search portal
- Sample player profile
- Upload form shell
- Stat verification queue
- Admin dashboard
- API route shells for contact requests and stat verification
- Mock data layer
- Supabase/Postgres schema draft

## First engineering milestone

Replace mock data in `lib/mock-data.ts` with Supabase queries. Keep the UI components mostly the same.

## MVP validation milestone

The MVP is useful when one real player can:

1. Create a profile
2. Add a game video link
3. Submit a stat line
4. Get stats verified by admin
5. Share the profile with a coach
6. Receive a contact request
