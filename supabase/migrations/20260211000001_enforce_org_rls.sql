-- Enable RLS on core tables
alter table public.properties enable row level security;
alter table public.sessions enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.discounts enable row level security;

-- Helper function to get current user's org id
create or replace function public.get_auth_organization_id()
returns uuid
language sql
security definer
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- 1. PROPERTIES
-- View: Members of the organization can view properties
create policy "Org members can view properties"
  on public.properties for select
  using ( organization_id = public.get_auth_organization_id() );

-- Managed by: Owners/Admins (TODO: Refine for staff later?)
create policy "Org owners can manage properties"
  on public.properties for all
  using ( organization_id = public.get_auth_organization_id() 
          and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'property_owner')) );

-- 2. SESSIONS
-- View: Members of the organization can view sessions
create policy "Org members can view sessions"
  on public.sessions for select
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) );

-- Insert: Usually public (via API/anon key) OR Org members for manual creation?
-- The public insert is handled via service-role in actions usually, or if we allow public insert we need a policy.
-- Currently, checkout uses service role for creation? No, actions use service role often.
-- Let's enable authenticated users to view. Public insert for 'anon' users via RLS?
-- Actually, the checkout action uses `createClient` (which is authenticated context or anon context).
-- If we use `createClient` in server action, it uses the cookie auth.
-- For public checkout (unauthenticated user), we might need `createClient` with ANON key but no user session.
-- So we need an ANON policy for INSERT on sessions?
-- Or better: Checkout creates session using service role (admin client) to bypass RLS, returns ID.
-- The current checkout.ts uses `createClient`. If user is anon, `auth.uid()` is null.

-- ANON INSERT POLICY for Sessions (Public Parking)
create policy "Anyone can insert sessions"
  on public.sessions for insert
  with check ( true ); 

-- Members can update (e.g. valid staff)? 
-- Or easier: Service Role handles updates. Actions use `createClient` which is limited. 
-- We might need to switch actions to use `createAdminClient` for critical writes if RLS gets in the way.
-- For now, let's allow org members to update sessions (e.g. manually expire/refund).
create policy "Org members can update sessions"
  on public.sessions for update
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) );


-- 3. PRICING RULES & DISCOUNTS
-- View/Manager: Same as Properties
create policy "Org members can view pricing_rules"
  on public.pricing_rules for select
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) );

create policy "Org owners can manage pricing_rules"
  on public.pricing_rules for all
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) 
          and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'property_owner')) );

create policy "Org members can view discounts"
  on public.discounts for select
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) );

create policy "Org owners can manage discounts"
  on public.discounts for all
  using ( property_id in (select id from public.properties where organization_id = public.get_auth_organization_id()) 
          and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'property_owner')) );
