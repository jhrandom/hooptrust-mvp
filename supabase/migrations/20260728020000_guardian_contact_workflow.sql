-- Keep private contact details separate from recruiter-discoverable profiles.
create table public.player_contact_details (
  player_id uuid primary key references public.players(id) on delete cascade,
  contact_name text not null,
  relationship text not null,
  email text not null,
  phone text,
  consent_confirmed_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.player_contact_details enable row level security;

create or replace function public.owns_player(target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players
    where id = target_player_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_approved_contact_request(target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.contact_requests cr
    join public.recruiters r on r.id = cr.recruiter_id
    where cr.player_id = target_player_id
      and cr.status = 'approved'
      and r.user_id = auth.uid()
      and r.status = 'approved'::public.recruiter_status
  );
$$;

revoke all on function public.owns_player(uuid) from public;
revoke all on function public.has_approved_contact_request(uuid) from public;
grant execute on function public.owns_player(uuid) to authenticated;
grant execute on function public.has_approved_contact_request(uuid) to authenticated;

create policy "Players manage own contact details"
on public.player_contact_details for all
to authenticated
using (public.owns_player(player_id))
with check (public.owns_player(player_id));

create policy "Approved requesters view designated contact"
on public.player_contact_details for select
to authenticated
using (public.has_approved_contact_request(player_id));

create policy "Admins view designated contacts"
on public.player_contact_details for select
to authenticated
using (public.is_admin());
