-- CNC OS: one workspace snapshot per organization; run once in Supabase SQL Editor.
-- Existing data is not deleted or overwritten by this migration.
create table if not exists public.workspace_snapshots (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.workspace_snapshots enable row level security;
drop policy if exists "workspace_admin_read" on public.workspace_snapshots;
create policy "workspace_admin_read" on public.workspace_snapshots for select to authenticated
 using (exists(select 1 from public.memberships m where m.organization_id=workspace_snapshots.organization_id and m.user_id=auth.uid() and m.role='admin'));
drop policy if exists "workspace_admin_insert" on public.workspace_snapshots;
create policy "workspace_admin_insert" on public.workspace_snapshots for insert to authenticated
 with check (exists(select 1 from public.memberships m where m.organization_id=workspace_snapshots.organization_id and m.user_id=auth.uid() and m.role='admin') and updated_by=auth.uid());
drop policy if exists "workspace_admin_update" on public.workspace_snapshots;
create policy "workspace_admin_update" on public.workspace_snapshots for update to authenticated
 using (exists(select 1 from public.memberships m where m.organization_id=workspace_snapshots.organization_id and m.user_id=auth.uid() and m.role='admin'))
 with check (exists(select 1 from public.memberships m where m.organization_id=workspace_snapshots.organization_id and m.user_id=auth.uid() and m.role='admin') and updated_by=auth.uid());
create or replace function public.save_workspace(expected_revision bigint, new_payload jsonb)
returns bigint language plpgsql security invoker set search_path=public as $$
declare org uuid; rev bigint;
begin
 select organization_id into org from public.memberships where user_id=auth.uid() and role='admin' limit 1;
 if org is null then raise exception 'Keine Administratorberechtigung'; end if;
 update public.workspace_snapshots set payload=new_payload, revision=revision+1,updated_at=now(),updated_by=auth.uid()
 where organization_id=org and revision=expected_revision returning revision into rev;
 if rev is null then raise exception 'Versionskonflikt: Cloud wurde auf anderem Gerät geändert'; end if;
 return rev;
end $$;
