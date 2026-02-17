-- Create property_members table for granular staff access
create table if not exists property_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null, -- Changed to refer to profiles for Public schema joins
  property_id uuid references properties(id) on delete cascade not null,
  role text not null check (role in ('staff', 'manager', 'enforcement')), 
  created_at timestamptz default now(),
  unique(user_id, property_id)
);

-- RLS for property_members
alter table property_members enable row level security;

-- Admin can manage all members
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins can manage all property members') then
    create policy "Admins can manage all property members"
      on property_members
      for all
      to authenticated
      using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
      );
  end if;
end $$;

-- Organization owners can manage members for their org's properties
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Org owners can manage property members') then
      create policy "Org owners can manage property members"
      on property_members
      for all
      to authenticated
      using (
        exists (
          select 1 from profiles
          join properties on properties.organization_id = profiles.organization_id
          where profiles.id = auth.uid() 
          and profiles.role = 'property_owner'
          and properties.id = property_members.property_id
        )
      );
  end if;
end $$;

-- Users can view their own memberships
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own memberships') then
      create policy "Users can view own memberships"
      on property_members
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

-- Indexes for performance
create index if not exists property_members_user_id_idx on property_members(user_id);
create index if not exists property_members_property_id_idx on property_members(property_id);

-- Update RLS for properties to include property_members check
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Staff can view assigned properties') then
      create policy "Staff can view assigned properties"
      on properties
      for select
      to authenticated
      using (
        exists (
          select 1 from property_members
          where property_members.property_id = properties.id
          and property_members.user_id = auth.uid()
        )
      );
  end if;
end $$;
