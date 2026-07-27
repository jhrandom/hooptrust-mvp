-- Break the circular RLS dependency between players and recruiters.
-- Security-definer helpers perform narrowly scoped authorization checks
-- without recursively evaluating policies on the referenced tables.

create or replace function public.is_approved_recruiter()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.recruiters
    where user_id = auth.uid()
      and status = 'approved'::public.recruiter_status
  );
$$;

create or replace function public.can_view_recruiter(target_recruiter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.contact_requests cr
    join public.players p on p.id = cr.player_id
    where cr.recruiter_id = target_recruiter_id
      and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_approved_recruiter() from public;
revoke all on function public.can_view_recruiter(uuid) from public;
grant execute on function public.is_approved_recruiter() to authenticated;
grant execute on function public.can_view_recruiter(uuid) to authenticated;

drop policy if exists "Authorized users can view players" on public.players;
create policy "Authorized users can view players"
on public.players for select
to authenticated
using (
  user_id = auth.uid()
  or visibility = 'public'
  or public.is_admin()
  or (
    visibility = 'recruiter_visible'
    and public.is_approved_recruiter()
  )
);

drop policy if exists "Players can view requesting recruiter identity" on public.recruiters;
create policy "Players can view requesting recruiter identity"
on public.recruiters for select
to authenticated
using (public.can_view_recruiter(id));
