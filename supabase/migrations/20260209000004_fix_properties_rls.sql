-- Enable RLS policies for properties and organizations

-- PROPERTIES POLICIES
create policy "Admins can do everything on properties"
  on properties
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Allow reading properties if you belong to the organization (optional basic check for now)
create policy "Users can view properties of their organization"
  on properties
  for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.organization_id = properties.organization_id
    )
  );


-- ORGANIZATIONS POLICIES
create policy "Admins can do everything on organizations"
  on organizations
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Allow all authenticated users to read organizations (needed for looking up orgs during setup/login maybe?)
-- Or just restrict to own org.
create policy "Users can view their own organization"
  on organizations
  for select
  to authenticated
  using (
    id in (
      select organization_id from profiles where id = auth.uid()
    )
  );
