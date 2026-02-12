-- 1. DISCOUNTS
-- Public view policy was already created in 20260211000002_public_discounts.sql
-- We just need to ensure RLS is enabled and add management policies.

alter table public.discounts enable row level security;

-- Org owners can manage discounts
create policy "Org owners can manage discounts"
  on public.discounts
  for all
  to authenticated
  using (
    property_id in (
      select id from public.properties
      where organization_id = public.get_auth_organization_id()
    )
    AND exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'property_owner')
    )
  );

-- 2. SPOTS
alter table public.spots enable row level security;

-- Public can view active spots (needed for booking/selection)
create policy "Public can view active spots"
  on public.spots
  for select
  using ( true );

-- Org owners can manage spots
create policy "Org owners can manage spots"
  on public.spots
  for all
  to authenticated
  using (
    property_id in (
      select id from public.properties
      where organization_id = public.get_auth_organization_id()
    )
    AND exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'property_owner')
    )
  );

-- 3. SESSION TRANSACTIONS
alter table public.session_transactions enable row level security;

-- Org owners can view session transactions
-- Transactions are linked to sessions, which are linked to properties.
create policy "Org owners can view session transactions"
  on public.session_transactions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sessions s
      join public.properties p on s.property_id = p.id
      where s.id = session_transactions.session_id
      and p.organization_id = public.get_auth_organization_id()
    )
    AND exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'property_owner')
    )
  );
