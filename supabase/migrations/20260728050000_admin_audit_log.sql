-- Central audit trail for privileged administrative decisions.
create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_action_logs_created_at_idx on public.admin_action_logs (created_at desc);
create index admin_action_logs_entity_idx on public.admin_action_logs (entity_type, entity_id);

alter table public.admin_action_logs enable row level security;

create policy "Admins can view audit logs"
on public.admin_action_logs for select
to authenticated
using (public.is_admin());

create policy "Admins can create audit logs"
on public.admin_action_logs for insert
to authenticated
with check (public.is_admin() and admin_id = auth.uid());
