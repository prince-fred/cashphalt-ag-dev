create policy "Admins can do everything on pricing_rules"
  on public.pricing_rules
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

