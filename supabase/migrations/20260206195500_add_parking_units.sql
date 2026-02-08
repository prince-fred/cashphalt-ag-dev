-- Create parking_units table
CREATE TABLE IF NOT EXISTS public.parking_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(property_id, name)
);

-- Add RLS policies
ALTER TABLE public.parking_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.parking_units
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert access" ON public.parking_units
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON public.parking_units
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete access" ON public.parking_units
    FOR DELETE
    TO authenticated
    USING (true);

-- Add spot_id to sessions if not exists (though the plan said it might be new, checking db-types showed it as nullable string, let's confirm usage)
-- In db-types.ts: spot_id: string | null. So it exists in types, but let's make sure it is a FK if possible.
-- The existing db-types.ts shows `spot_id` in `sessions`. Checking `seed.sql` or earlier migrations would confirm if it's a FK.
-- `20250201000000_init.sql` would have the definition.
-- I'll assume `spot_id` in `sessions` is just a text or UUID but maybe not a FK yet.
-- To be safe, I will NOT add a FK constraint on `sessions.spot_id` to `parking_units.id` yet to avoid breaking existing data if any, unless I'm sure.
-- The plan didn't explicitly say to add a FK, just "Insert spot_id into sessions table".
-- I'll stick to creating `parking_units` table for now.
