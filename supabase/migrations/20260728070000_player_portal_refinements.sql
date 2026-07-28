-- Preserve original submissions when admins correct stats.
alter table public.stats add column submitted_values jsonb;
alter table public.games add column team_name text;

update public.stats
set submitted_values = jsonb_build_object(
  'jersey_number', jersey_number, 'points', points, 'rebounds', rebounds,
  'assists', assists, 'steals', steals, 'blocks', blocks,
  'turnovers', turnovers, 'fgm', fgm, 'fga', fga, 'tpm', tpm,
  'tpa', tpa, 'ftm', ftm, 'fta', fta, 'minutes', minutes
)
where submitted_values is null;

-- Make genuinely public profiles readable without authentication.
create policy "Anyone can view public players"
on public.players for select
to anon
using (visibility = 'public');

create policy "Anyone can view verified public stats"
on public.stats for select
to anon
using (
  verification_status = 'verified'
  and exists (select 1 from public.players p where p.id = player_id and p.visibility = 'public')
);

create policy "Anyone can view approved public games"
on public.games for select
to anon
using (
  approval_status = 'approved'
  and exists (
    select 1
    from public.stats s
    join public.players p on p.id = s.player_id
    where s.game_id = games.id and s.verification_status = 'verified' and p.visibility = 'public'
  )
);

create policy "Anyone can view approved public videos"
on public.videos for select
to anon
using (
  approval_status = 'approved'
  and exists (select 1 from public.players p where p.id = player_id and p.visibility = 'public')
);

create policy "Anyone can view public schedules"
on public.player_schedule for select
to anon
using (exists (select 1 from public.players p where p.id = player_id and p.visibility = 'public'));

-- Count at most one recruiter view per player per calendar day.
alter table public.player_profile_views
  add column viewed_on date not null default current_date;

delete from public.player_profile_views a
using public.player_profile_views b
where a.id > b.id
  and a.player_id = b.player_id
  and a.recruiter_id = b.recruiter_id
  and a.viewed_on = b.viewed_on;

create unique index player_profile_views_daily_unique
  on public.player_profile_views (player_id, recruiter_id, viewed_on);

-- Persistent read state for derived player notifications.
create table public.notification_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, event_key)
);

alter table public.notification_reads enable row level security;
create policy "Users manage own notification reads"
on public.notification_reads for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Preserve the timezone the player intended for schedule display.
alter table public.player_schedule
  add column timezone text not null default 'UTC';

-- Public profile-photo bucket. Players may write only within their user folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload own profile photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own profile photos"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own profile photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
