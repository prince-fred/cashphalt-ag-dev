-- Redefine get_auth_organization_id without security definer to avoid search_path complexity
-- and rely on the standard "Public profiles are viewable by everyone" policy.
create or replace function public.get_auth_organization_id()
returns uuid
language sql
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- Simplify pricing_rules policies to be explicit per operation
DROP POLICY IF EXISTS "Org owners can manage pricing_rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Org members can view pricing_rules" ON public.pricing_rules;

-- 1. VIEW (Select)
create policy "Org members can view pricing_rules"
  on public.pricing_rules for select
  using ( 
    property_id in (
      select id from public.properties 
      where organization_id = public.get_auth_organization_id()
    ) 
  );

-- 2. MANAGE (Insert, Update, Delete)
-- Split allows us to debug easier if needed, but keeping logic same for now.
create policy "Org owners can raise pricing_rules"
  on public.pricing_rules for insert
  with check (
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

create policy "Org owners can update pricing_rules"
  on public.pricing_rules for update
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

create policy "Org owners can delete pricing_rules"
  on public.pricing_rules for delete
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
