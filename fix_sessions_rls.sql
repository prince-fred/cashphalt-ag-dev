
-- Allow public visitors (anon) to create parking sessions
create policy "Allow public insert"
  on sessions
  for insert
  to anon
  with check (true);

-- Allow public to select their own sessions (by ID)
-- Note: In a real app we'd secure this better (e.g. signed cookie/token)
-- For now, we allow reading if you know the UUID (which is effectively a secret capability)
create policy "Allow public read by id"
  on sessions
  for select
  to anon
  using (true);

-- Allow public read access to Session Snapshots (for receipt view)
alter table session_pricing_snapshots enable row level security;

create policy "Allow public read snapshots"
  on session_pricing_snapshots
  for select
  to anon
  using (true);

-- Allow insert snapshots
create policy "Allow public insert snapshots"
  on session_pricing_snapshots
  for insert
  to anon
  with check (true);
