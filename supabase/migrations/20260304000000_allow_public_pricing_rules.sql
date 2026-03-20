create policy "Public can view active pricing rules"
  on public.pricing_rules
  for select
  to public
  using (is_active = true);
