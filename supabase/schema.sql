-- CNC OS: run in a new Supabase project SQL editor.
-- No service-role key may be exposed in GitHub Pages.
create extension if not exists pgcrypto;
create table public.organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 150),
 created_at timestamptz not null default now()
);
create table public.memberships (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('admin','manager','employee','viewer')),
 created_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 number text not null,
 title text not null,
 customer text,
 material text,
 quantity integer not null default 1 check(quantity > 0),
 drawing_revision text,
 status text not null default 'draft' check(status in ('draft','review','approved','production','completed','cancelled')),
 source_text text,
 created_by uuid not null references auth.users(id),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,number),
 unique(id,organization_id)
);
create table public.order_documents (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 order_id uuid not null,
 kind text not null check(kind in ('drawing','cutting','workplan','nc','quality','other')),
 storage_path text not null,
 filename text not null,
 revision text,
 created_at timestamptz not null default now(),
 foreign key(order_id,organization_id) references public.orders(id,organization_id) on delete cascade
);
create index on public.orders(organization_id,created_at desc);
create index on public.order_documents(order_id);
create or replace function public.has_org_role(org uuid, allowed text[])
returns boolean language sql stable security definer set search_path = ''
as $$select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()) and m.role=any(allowed))$$;
revoke all on function public.has_org_role(uuid,text[]) from public;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.orders enable row level security;
alter table public.order_documents enable row level security;
create policy org_read on public.organizations for select to authenticated using(public.has_org_role(id,array['admin','manager','employee','viewer']));
create policy member_read on public.memberships for select to authenticated using(public.has_org_role(organization_id,array['admin','manager','employee','viewer']));
create policy order_read on public.orders for select to authenticated using(public.has_org_role(organization_id,array['admin','manager','employee','viewer']));
create policy order_insert on public.orders for insert to authenticated with check(public.has_org_role(organization_id,array['admin','manager','employee']) and created_by=(select auth.uid()) and status='draft' and approved_by is null and approved_at is null);
create policy order_update on public.orders for update to authenticated using(public.has_org_role(organization_id,array['admin','manager'])) with check(public.has_org_role(organization_id,array['admin','manager']));
create policy doc_read on public.order_documents for select to authenticated using(public.has_org_role(organization_id,array['admin','manager','employee','viewer']));
create policy doc_insert on public.order_documents for insert to authenticated with check(public.has_org_role(organization_id,array['admin','manager','employee']));
-- Block direct approval edits; approvals must go through the guarded RPC below.
create or replace function public.guard_order_changes() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.organization_id is distinct from old.organization_id or new.created_by is distinct from old.created_by or new.id is distinct from old.id then raise exception 'Immutable order identity'; end if;
 if new.status is distinct from old.status or new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at then
   if current_setting('app.approving_order',true) is distinct from 'yes' then raise exception 'Use approval workflow'; end if;
 end if;
 new.updated_at=now(); return new;
end $$;
create trigger guard_order before update on public.orders for each row execute function public.guard_order_changes();
create or replace function public.approve_order(p_order uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
 select organization_id into v_org from public.orders where id=p_order for update;
 if v_org is null or not public.has_org_role(v_org,array['admin','manager']) then raise exception 'Not authorized'; end if;
 if not exists(select 1 from public.orders where id=p_order and status in ('draft','review')) then raise exception 'Order not approvable'; end if;
 perform set_config('app.approving_order','yes',true);
 update public.orders set status='approved',approved_by=auth.uid(),approved_at=now() where id=p_order;
 perform set_config('app.approving_order','',true);
end $$;
revoke all on function public.approve_order(uuid) from public;
grant execute on function public.approve_order(uuid) to authenticated;
-- Create organizations/memberships only from a trusted admin backend or manually in SQL editor.
-- Storage: create PRIVATE bucket 'order-files'; use authenticated signed URLs and matching org membership policies.
