-- Link sessions.spot_id to parking_units.id
-- This allows us to join sessions with parking_units
ALTER TABLE public.sessions
ADD CONSTRAINT fk_sessions_parking_units
FOREIGN KEY (spot_id)
REFERENCES public.parking_units (id)
ON DELETE SET NULL;
