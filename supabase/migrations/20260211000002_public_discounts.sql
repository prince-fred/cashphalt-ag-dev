-- Allow public read access to active discounts (needed for checkout)
create policy "Public can view active discounts"
  on public.discounts for select
  using ( is_active = true );
