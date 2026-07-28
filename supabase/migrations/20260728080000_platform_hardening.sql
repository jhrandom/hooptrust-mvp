-- Restricted public projection: never expose birth year, GPA, user id, or private contact data.
drop policy if exists "Anyone can view public players" on public.players;

create or replace function public.is_public_player(target_player_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.players where id = target_player_id and visibility = 'public'); $$;
revoke all on function public.is_public_player(uuid) from public;
grant execute on function public.is_public_player(uuid) to anon, authenticated;

create or replace view public.public_player_profiles
with (security_barrier = true, security_invoker = false)
as select
  id, full_name, preferred_name, country, graduation_year, position, height, weight,
  dominant_hand, current_team, bio, recruiting_status, profile_photo_url, created_at, updated_at
from public.players where visibility = 'public';
revoke all on public.public_player_profiles from public;
grant select on public.public_player_profiles to anon, authenticated;

drop policy if exists "Anyone can view verified public stats" on public.stats;
create policy "Anyone can view verified public stats" on public.stats for select to anon
using (verification_status = 'verified' and public.is_public_player(player_id));
drop policy if exists "Anyone can view approved public videos" on public.videos;
create policy "Anyone can view approved public videos" on public.videos for select to anon
using (approval_status = 'approved' and public.is_public_player(player_id));
drop policy if exists "Anyone can view public schedules" on public.player_schedule;
create policy "Anyone can view public schedules" on public.player_schedule for select to anon
using (public.is_public_player(player_id));
drop policy if exists "Anyone can view approved public games" on public.games;
create policy "Anyone can view approved public games" on public.games for select to anon
using (
  approval_status = 'approved'
  and exists (
    select 1 from public.stats s
    where s.game_id = games.id
      and s.verification_status = 'verified'
      and public.is_public_player(s.player_id)
  )
);

-- Atomic evidence submission prevents orphaned games/videos/stats.
create or replace function public.submit_game_evidence(
  p_video_url text, p_game_date date, p_opponent text, p_team_name text,
  p_location text, p_tournament text, p_final_score text, p_stats jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_player_id uuid; v_game_id uuid; v_video_id uuid;
begin
  select id into v_player_id from public.players where user_id = auth.uid();
  if v_player_id is null then raise exception 'Player profile required'; end if;
  insert into public.games (submitted_by, opponent, team_name, game_date, location, final_score, tournament, approval_status)
  values (auth.uid(), nullif(p_opponent,''), nullif(p_team_name,''), p_game_date, nullif(p_location,''), nullif(p_final_score,''), nullif(p_tournament,''), 'pending')
  returning id into v_game_id;
  insert into public.videos (uploaded_by, player_id, game_id, video_url, visibility, approval_status)
  values (auth.uid(), v_player_id, v_game_id, p_video_url, 'private', 'pending') returning id into v_video_id;
  insert into public.stats (
    player_id, game_id, jersey_number, points, rebounds, assists, steals, blocks, turnovers,
    fgm, fga, tpm, tpa, ftm, fta, minutes, submitted_values, source, verification_status, confidence
  ) values (
    v_player_id, v_game_id, (p_stats->>'jersey_number')::int, (p_stats->>'points')::int,
    (p_stats->>'rebounds')::int, (p_stats->>'assists')::int, (p_stats->>'steals')::int,
    (p_stats->>'blocks')::int, (p_stats->>'turnovers')::int, (p_stats->>'fgm')::int,
    (p_stats->>'fga')::int, (p_stats->>'tpm')::int, (p_stats->>'tpa')::int,
    (p_stats->>'ftm')::int, (p_stats->>'fta')::int, (p_stats->>'minutes')::numeric,
    p_stats, 'manual', 'pending', 'Medium'
  );
  return v_video_id;
end; $$;
revoke all on function public.submit_game_evidence(text,date,text,text,text,text,text,jsonb) from public;
grant execute on function public.submit_game_evidence(text,date,text,text,text,text,text,jsonb) to authenticated;

-- Database-backed fixed-window rate limiting for authenticated mutations.
create table public.api_rate_limits (
  actor_id uuid not null, bucket text not null, window_start timestamptz not null,
  request_count int not null default 1, primary key (actor_id, bucket)
);
alter table public.api_rate_limits enable row level security;
create or replace function public.consume_rate_limit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_row public.api_rate_limits;
begin
  if auth.uid() is null then return false; end if;
  insert into public.api_rate_limits(actor_id,bucket,window_start,request_count)
  values(auth.uid(),p_bucket,now(),1)
  on conflict(actor_id,bucket) do update set
    window_start = case when public.api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else public.api_rate_limits.window_start end,
    request_count = case when public.api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else public.api_rate_limits.request_count + 1 end
  returning * into v_row;
  return v_row.request_count <= p_limit;
end; $$;
revoke all on function public.consume_rate_limit(text,int,int) from public;
grant execute on function public.consume_rate_limit(text,int,int) to authenticated;

-- Richer recruiter verification.
alter table public.recruiters
  add column organization_website text,
  add column institutional_email text,
  add column supporting_document_url text,
  add column verified_at timestamptz,
  add column verification_expires_at timestamptz;

-- Approval expires and must be renewed by an administrator.
create or replace function public.is_approved_recruiter()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.recruiters
    where user_id = auth.uid()
      and status = 'approved'
      and (verification_expires_at is null or verification_expires_at > now())
  );
$$;
revoke all on function public.is_approved_recruiter() from public;
grant execute on function public.is_approved_recruiter() to authenticated;

-- Guardian/coach/team/highlight structures.
create table public.guardian_player_links (
  guardian_user_id uuid references public.profiles(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  status text not null default 'pending', created_at timestamptz not null default now(),
  primary key (guardian_user_id, player_id)
);
create table public.coach_references (
  id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id) on delete cascade,
  coach_name text not null, organization text, email text, relationship text, consent_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.player_teams (
  id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id) on delete cascade,
  team_name text not null, season text not null, role text, created_at timestamptz not null default now()
);
alter table public.videos add column highlight_order int, add column is_highlight boolean not null default false;
alter table public.players add column height_cm numeric, add column weight_kg numeric;

alter table public.guardian_player_links enable row level security;
alter table public.coach_references enable row level security;
alter table public.player_teams enable row level security;
create policy "Guardians view own links" on public.guardian_player_links for select to authenticated using (guardian_user_id=auth.uid() or public.owns_player(player_id) or public.is_admin());
create policy "Players invite guardians" on public.guardian_player_links for insert to authenticated with check (public.owns_player(player_id));
create policy "Players manage coach references" on public.coach_references for all to authenticated using(public.owns_player(player_id)) with check(public.owns_player(player_id));
create policy "Approved recruiters view consented references" on public.coach_references for select to authenticated using(consent_confirmed and public.is_approved_recruiter());
create policy "Players manage teams" on public.player_teams for all to authenticated using(public.owns_player(player_id)) with check(public.owns_player(player_id));
create policy "Approved recruiters view teams" on public.player_teams for select to authenticated using(public.is_approved_recruiter());

create or replace function public.link_guardian_by_email(p_player_id uuid, p_email text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_guardian uuid;
begin
  if not public.owns_player(p_player_id) then raise exception 'Not authorized'; end if;
  select u.id into v_guardian from auth.users u join public.profiles p on p.id=u.id
  where lower(u.email)=lower(p_email) and p.role='guardian' limit 1;
  if v_guardian is null then raise exception 'Guardian account not found'; end if;
  insert into public.guardian_player_links(guardian_user_id,player_id,status)
  values(v_guardian,p_player_id,'approved') on conflict do update set status='approved';
end; $$;
revoke all on function public.link_guardian_by_email(uuid,text) from public;
grant execute on function public.link_guardian_by_email(uuid,text) to authenticated;

create or replace function public.set_video_highlight(p_video_id uuid, p_is_highlight boolean, p_order int)
returns void language plpgsql security definer set search_path=''
as $$
begin
  update public.videos set is_highlight=p_is_highlight, highlight_order=p_order
  where id=p_video_id and uploaded_by=auth.uid() and approval_status='approved';
  if not found then raise exception 'Only your approved videos can become highlights'; end if;
end; $$;
revoke all on function public.set_video_highlight(uuid,boolean,int) from public;
grant execute on function public.set_video_highlight(uuid,boolean,int) to authenticated;

-- Profile history and notification outbox hooks.
create table public.profile_change_history (
  id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null, old_values jsonb, new_values jsonb,
  changed_at timestamptz not null default now()
);
alter table public.profile_change_history enable row level security;
create policy "Players view own profile history" on public.profile_change_history for select to authenticated using(public.owns_player(player_id) or public.is_admin());
create or replace function public.log_player_profile_change() returns trigger language plpgsql security definer set search_path=''
as $$ begin insert into public.profile_change_history(player_id,changed_by,old_values,new_values) values(new.id,auth.uid(),to_jsonb(old),to_jsonb(new)); return new; end; $$;
create trigger player_profile_change_audit after update on public.players for each row execute function public.log_player_profile_change();

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(), recipient_user_id uuid references public.profiles(id) on delete cascade,
  template text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'pending',
  attempts int not null default 0, created_at timestamptz not null default now(), sent_at timestamptz
);
alter table public.notification_outbox enable row level security;
create policy "Users view own delivery status" on public.notification_outbox for select to authenticated using(recipient_user_id=auth.uid() or public.is_admin());

create or replace function public.queue_contact_notification() returns trigger
language plpgsql security definer set search_path=''
as $$
declare v_recipient uuid;
begin
  if tg_op='INSERT' then
    select user_id into v_recipient from public.players where id=new.player_id;
    insert into public.notification_outbox(recipient_user_id,template,payload)
    values(v_recipient,'contact_request_received',jsonb_build_object('request_id',new.id));
  elsif old.status is distinct from new.status then
    select user_id into v_recipient from public.recruiters where id=new.recruiter_id;
    insert into public.notification_outbox(recipient_user_id,template,payload)
    values(v_recipient,'contact_request_decided',jsonb_build_object('request_id',new.id,'status',new.status));
  end if;
  return new;
end; $$;
create trigger contact_notification_outbox after insert or update on public.contact_requests
for each row execute function public.queue_contact_notification();

create or replace function public.queue_evidence_notification() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  if old.approval_status is distinct from new.approval_status then
    insert into public.notification_outbox(recipient_user_id,template,payload)
    values(new.uploaded_by,'evidence_reviewed',jsonb_build_object('video_id',new.id,'status',new.approval_status));
  end if;
  return new;
end; $$;
create trigger evidence_notification_outbox after update on public.videos
for each row execute function public.queue_evidence_notification();

-- Retention helper; schedule it externally or with pg_cron where available.
create or replace function public.apply_retention_policy() returns void language plpgsql security definer set search_path=''
as $$ begin
  delete from public.spotify_sessions where expires_at < now();
  delete from public.api_rate_limits where window_start < now() - interval '7 days';
  delete from public.player_profile_views where viewed_at < now() - interval '2 years';
  delete from public.notification_outbox where status='sent' and sent_at < now() - interval '90 days';
end; $$;
revoke all on function public.apply_retention_policy() from public;
