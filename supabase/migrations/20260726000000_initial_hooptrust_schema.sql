-- HoopTrust MVP initial Supabase/Postgres migration.
-- Review minor/guardian consent requirements before production.

create type user_role as enum ('player', 'guardian', 'team_coach', 'recruiter', 'admin');
create type verification_status as enum ('not_submitted', 'pending', 'verified', 'needs_correction', 'rejected');
create type visibility_status as enum ('private', 'link_only', 'recruiter_visible', 'public');
create type recruiter_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'player',
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  school text,
  country text,
  city text,
  graduation_year int,
  birth_year int,
  position text,
  height text,
  weight text,
  dominant_hand text,
  current_team text,
  jersey_number int,
  bio text,
  gpa text,
  intended_major text,
  recruiting_status text default 'Open',
  visibility visibility_status default 'private',
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_or_club text,
  country text,
  coach_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  opponent text not null,
  game_date date,
  location text,
  final_score text,
  tournament text,
  approval_status text default 'pending',
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles(id),
  game_id uuid references public.games(id) on delete cascade,
  video_url text,
  file_path text,
  visibility visibility_status default 'private',
  approval_status text default 'pending',
  created_at timestamptz not null default now()
);

create table public.stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  points int default 0,
  rebounds int default 0,
  assists int default 0,
  steals int default 0,
  blocks int default 0,
  turnovers int default 0,
  fgm int default 0,
  fga int default 0,
  tpm int default 0,
  tpa int default 0,
  ftm int default 0,
  fta int default 0,
  minutes numeric default 0,
  source text default 'manual',
  verification_status verification_status default 'pending',
  confidence text default 'Medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  stat_id uuid references public.stats(id) on delete cascade,
  verified_by uuid references public.profiles(id),
  verification_source text,
  confidence text,
  final_status verification_status not null,
  admin_notes text,
  created_at timestamptz not null default now()
);

create table public.recruiters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  program text not null,
  title text,
  email text not null,
  status recruiter_status default 'pending',
  verification_notes text,
  created_at timestamptz not null default now()
);

create table public.saved_players (
  recruiter_id uuid references public.recruiters(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recruiter_id, player_id)
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references public.recruiters(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  message text not null,
  status text default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.games enable row level security;
alter table public.videos enable row level security;
alter table public.stats enable row level security;
alter table public.verification_records enable row level security;
alter table public.recruiters enable row level security;
alter table public.saved_players enable row level security;
alter table public.contact_requests enable row level security;

-- Starter policies. Tighten before production.
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Players can view visible profiles" on public.players for select using (visibility in ('public', 'recruiter_visible', 'link_only') or user_id = auth.uid());
create policy "Players can update own player record"
on public.players for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Create an application profile whenever Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' in ('player', 'guardian', 'team_coach', 'recruiter')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'player'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Users can create and remove their own application profile.
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can delete own profile"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

-- Players own their player record. Recruiter-visible and public records may be
-- read by authenticated users; link-only access needs a separate share-token
-- design before it should be exposed publicly.
drop policy "Players can view visible profiles" on public.players;
create policy "Authenticated users can view discoverable players"
on public.players for select
to authenticated
using (
  visibility in ('public', 'recruiter_visible')
  or user_id = auth.uid()
);

create policy "Players can insert own player record"
on public.players for insert
to authenticated
with check (user_id = auth.uid());

create policy "Players can delete own player record"
on public.players for delete
to authenticated
using (user_id = auth.uid());

-- Evidence submitters can manage their own videos.
create policy "Users can insert own videos"
on public.videos for insert
to authenticated
with check (uploaded_by = auth.uid());

create policy "Users can view own videos"
on public.videos for select
to authenticated
using (uploaded_by = auth.uid());

create policy "Users can update own videos"
on public.videos for update
to authenticated
using (uploaded_by = auth.uid())
with check (uploaded_by = auth.uid());

create policy "Users can delete own videos"
on public.videos for delete
to authenticated
using (uploaded_by = auth.uid());

-- Recruiters can manage only their own recruiter application.
create policy "Recruiters can insert own application"
on public.recruiters for insert
to authenticated
with check (user_id = auth.uid());

create policy "Recruiters can view own application"
on public.recruiters for select
to authenticated
using (user_id = auth.uid());

create policy "Recruiters can update own pending application"
on public.recruiters for update
to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (user_id = auth.uid() and status = 'pending');

-- Saved players and contact requests are scoped through the recruiter row.
create policy "Recruiters can manage own saved players"
on public.saved_players for all
to authenticated
using (
  exists (
    select 1 from public.recruiters r
    where r.id = recruiter_id and r.user_id = auth.uid() and r.status = 'approved'
  )
)
with check (
  exists (
    select 1 from public.recruiters r
    where r.id = recruiter_id and r.user_id = auth.uid() and r.status = 'approved'
  )
);

create policy "Recruiters can create own contact requests"
on public.contact_requests for insert
to authenticated
with check (
  exists (
    select 1 from public.recruiters r
    where r.id = recruiter_id and r.user_id = auth.uid() and r.status = 'approved'
  )
);

create policy "Participants can view contact requests"
on public.contact_requests for select
to authenticated
using (
  exists (
    select 1 from public.recruiters r
    where r.id = recruiter_id and r.user_id = auth.uid()
  )
  or exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);

-- Deliberately no client policies are granted yet for games, stats, or
-- verification_records. Add team membership and admin authorization before
-- exposing writes to those tables.
