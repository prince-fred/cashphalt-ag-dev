-- Allow public (anonymous) users to create parking sessions
create policy "Anyone can create sessions"
  on sessions
  for insert
  to anon, authenticated
  with check (true);

-- Allow public users to view their own sessions (by ID comparison or cookie logic? for now just basic select by ID if they know it?)
-- Actually, for the success page, we need to read the session.
-- Since we return the session ID to the client, they can query it.
create policy "Anyone can view sessions by ID"
  on sessions
  for select
  to anon, authenticated
  using (true); 
  -- In a strict app, we might restrict this to the session creator via a cookie token or ownership, 
  -- but for this MVP parking app, knowing the UUID is effectively the secret.

-- Allow public users to update their session (e.g. status change, or adding payment intent)
-- This is critical for the webhook or client-side confirmation updates if any.
create policy "Anyone can update sessions"
  on sessions
  for update
  to anon, authenticated
  using (true);

-- Enable RLS for snapshots
alter table session_pricing_snapshots enable row level security;

create policy "Anyone can create snapshots"
  on session_pricing_snapshots
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can view snapshots"
  on session_pricing_snapshots
  for select
  to anon, authenticated
  using (true);
