-- Drop the existing constraint
alter table public.profiles drop constraint if exists profiles_role_check;

-- Add new constraint with 'staff' role
alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'property_owner', 'staff'));

-- Comment
comment on column public.profiles.role is 'Role of the user in the organization: admin (super), property_owner (org admin), staff (employee)';
