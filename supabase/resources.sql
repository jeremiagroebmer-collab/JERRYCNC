-- CNC OS · Stammdaten-Synchronisierung (zusätzlich zum bestehenden Schema)
-- Einmalig im Supabase SQL Editor ausführen. Keine vorhandenen Tabellen löschen.
create table if not exists public.resource_records (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 category text not null check(category in ('machines','materials','tools')),
 local_id text not null,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 unique (organization_id, category, local_id)
);
create index if not exists resource_records_org_category_idx on public.resource_records(organization_id,category);
alter table public.resource_records enable row level security;
drop policy if exists resource_records_read on public.resource_records;
create policy resource_records_read on public.resource_records for select to authenticated
 using(public.has_org_role(organization_id,array['admin','manager','employee','viewer']));
drop policy if exists resource_records_write on public.resource_records;
create policy resource_records_write on public.resource_records for insert to authenticated
 with check(public.has_org_role(organization_id,array['admin','manager']));
drop policy if exists resource_records_update on public.resource_records;
create policy resource_records_update on public.resource_records for update to authenticated
 using(public.has_org_role(organization_id,array['admin','manager']))
 with check(public.has_org_role(organization_id,array['admin','manager']));
-- Löschen bewusst nicht freigegeben; Migration darf vorhandene Stammdaten nicht vernichten.
