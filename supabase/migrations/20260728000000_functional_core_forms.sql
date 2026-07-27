-- Constraints and policies required by the functional MVP forms.
alter table public.players
  add constraint players_user_id_key unique (user_id);

alter table public.recruiters
  add constraint recruiters_user_id_key unique (user_id);

alter table public.games
  add column submitted_by uuid references public.profiles(id) on delete set null;

alter table public.videos
  add column player_id uuid references public.players(id) on delete cascade;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'::public.user_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy "Authenticated users can view discoverable players" on public.players;
create policy "Authorized users can view players"
on public.players for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or public.is_admin()
  or (
    visibility = 'recruiter_visible'
    and exists (
      select 1 from public.recruiters r
      where r.user_id = auth.uid() and r.status = 'approved'
    )
  )
);

create policy "Users can submit games"
on public.games for insert
to authenticated
with check (submitted_by = auth.uid());

create policy "Submitters can view own games"
on public.games for select
to authenticated
using (submitted_by = auth.uid() or public.is_admin());

create policy "Admins can manage games"
on public.games for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "Admins can manage recruiters"
on public.recruiters for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Players can view requesting recruiter identity"
on public.recruiters for select
to authenticated
using (
  exists (
    select 1
    from public.contact_requests cr
    join public.players p on p.id = cr.player_id
    where cr.recruiter_id = recruiters.id and p.user_id = auth.uid()
  )
);

create policy "Admins can manage videos"
on public.videos for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view approved discoverable videos"
on public.videos for select
to authenticated
using (
  approval_status = 'approved'
  and exists (
    select 1 from public.players p
    where p.id = player_id and p.visibility in ('public', 'recruiter_visible')
  )
);

drop policy "Users can insert own videos" on public.videos;
create policy "Users can insert own player videos"
on public.videos for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);

create policy "Admins can manage stats"
on public.stats for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Players can submit own stats"
on public.stats for insert
to authenticated
with check (
  exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);

create policy "Players can view own stats"
on public.stats for select
to authenticated
using (
  exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);

create policy "Authenticated users can view verified discoverable stats"
on public.stats for select
to authenticated
using (
  verification_status = 'verified'
  and exists (
    select 1 from public.players p
    where p.id = player_id and p.visibility in ('public', 'recruiter_visible')
  )
);

create policy "Admins can manage verification records"
on public.verification_records for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage contact requests"
on public.contact_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Players can decide their contact requests"
on public.contact_requests for update
to authenticated
using (
  exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players p
    where p.id = player_id and p.user_id = auth.uid()
  )
);
