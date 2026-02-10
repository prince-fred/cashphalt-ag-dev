-- Create the storage bucket for property assets
insert into storage.buckets (id, name, public)
values ('property-assets', 'property-assets', true);

-- Policy to allow public read access to the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'property-assets' );

-- Policy to allow authenticated users (admins) to upload images
-- Assuming all authenticated users are admins for now as per previous context, 
-- or we can restrict it further if needed. 
-- For now, allowing any authenticated user to insert/update.
create policy "Auth Users Can Upload"
  on storage.objects for insert
  with check ( bucket_id = 'property-assets' and auth.role() = 'authenticated' );

create policy "Auth Users Can Update"
  on storage.objects for update
  with check ( bucket_id = 'property-assets' and auth.role() = 'authenticated' );

create policy "Auth Users Can Delete"
  on storage.objects for delete
  using ( bucket_id = 'property-assets' and auth.role() = 'authenticated' );
