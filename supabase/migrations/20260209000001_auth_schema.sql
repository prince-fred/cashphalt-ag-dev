-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'property_owner')),
  organization_id uuid references public.organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a function to handle new user signup (optional, for auto-profile creation if we use Supabase Auth UI)
-- But since we are likely creating users manually via admin, we might not need a trigger immediately, 
-- but it's good practice.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'property_owner', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger to create profile on signup
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Policies for storage (refining previous ones)
-- Allow authenticated users to upload if they are admins or property owners (checked via profiles?)
-- For now, keeping the simple "authenticated" check from previous step is fine, 
-- but eventually we might want:
-- create policy "Admins can upload"
--   on storage.objects for insert
--   with check ( bucket_id = 'property-assets' and exists (
--     select 1 from public.profiles where id = auth.uid() and role = 'admin'
--   ));
