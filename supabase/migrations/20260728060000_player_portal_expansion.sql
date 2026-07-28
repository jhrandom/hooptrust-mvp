-- Player portal activity, review feedback, schedules, and privacy controls.
alter table public.videos
  add column review_notes text,
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz;

create table public.player_profile_views (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  recruiter_id uuid references public.recruiters(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create table public.player_schedule (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  event_name text not null,
  opponent text,
  event_date timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.rhythm_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  playlist_name text not null,
  playlist_url text not null,
  created_at timestamptz not null default now()
);

alter table public.player_profile_views enable row level security;
alter table public.player_schedule enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.rhythm_playlists enable row level security;

create policy "Approved recruiters record profile views"
on public.player_profile_views for insert
to authenticated
with check (
  public.is_approved_recruiter()
  and exists (
    select 1 from public.recruiters r
    where r.id = recruiter_id and r.user_id = auth.uid()
  )
);

create policy "Players view own profile activity"
on public.player_profile_views for select
to authenticated
using (public.owns_player(player_id) or public.is_admin());

create policy "Players view who saved their profile count"
on public.saved_players for select
to authenticated
using (public.owns_player(player_id) or public.is_admin());

create policy "Players manage own schedule"
on public.player_schedule for all
to authenticated
using (public.owns_player(player_id))
with check (public.owns_player(player_id));

create policy "Approved recruiters view discoverable schedules"
on public.player_schedule for select
to authenticated
using (
  public.is_approved_recruiter()
  and exists (
    select 1 from public.players p
    where p.id = player_id and p.visibility in ('public', 'recruiter_visible')
  )
);

create policy "Users create own deletion requests"
on public.deletion_requests for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users view own deletion requests"
on public.deletion_requests for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Admins manage deletion requests"
on public.deletion_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users manage own Rhythm history"
on public.rhythm_playlists for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Players may correct or withdraw only evidence that is still pending.
drop policy if exists "Users can update own videos" on public.videos;
drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can update pending own videos"
on public.videos for update
to authenticated
using (uploaded_by = auth.uid() and approval_status = 'pending')
with check (uploaded_by = auth.uid() and approval_status = 'pending');

create policy "Users can delete pending own videos"
on public.videos for delete
to authenticated
using (uploaded_by = auth.uid() and approval_status = 'pending');

create policy "Players update pending own stats"
on public.stats for update
to authenticated
using (
  verification_status = 'pending'
  and exists (select 1 from public.players p where p.id = player_id and p.user_id = auth.uid())
)
with check (
  verification_status = 'pending'
  and exists (select 1 from public.players p where p.id = player_id and p.user_id = auth.uid())
);

create policy "Players delete pending own stats"
on public.stats for delete
to authenticated
using (
  verification_status = 'pending'
  and exists (select 1 from public.players p where p.id = player_id and p.user_id = auth.uid())
);

create policy "Submitters update pending games"
on public.games for update
to authenticated
using (submitted_by = auth.uid() and approval_status = 'pending')
with check (submitted_by = auth.uid() and approval_status = 'pending');

create policy "Submitters delete pending games"
on public.games for delete
to authenticated
using (submitted_by = auth.uid() and approval_status = 'pending');
