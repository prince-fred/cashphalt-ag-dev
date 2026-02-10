-- Add warning_sent column to sessions table to track if expiry warning has been sent
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS warning_sent boolean DEFAULT false;
