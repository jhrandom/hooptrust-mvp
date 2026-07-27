-- Server-only persistence for encrypted Spotify OAuth sessions.
create table public.spotify_sessions (
  id text primary key,
  sealed_session text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spotify_sessions enable row level security;

-- No anon or authenticated policies are intentionally defined. Only the
-- server-side Supabase secret client may access these encrypted sessions.
