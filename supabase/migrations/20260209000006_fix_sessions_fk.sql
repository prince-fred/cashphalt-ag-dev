-- Drop the old foreign key constraint referencing the 'spots' table
alter table sessions drop constraint if exists sessions_spot_id_fkey;

-- Optionally, add a new FK to parking_units if we want to enforce it.
-- However, since `spot_id` might be used for legacy spots OR parking units,
-- or maybe we want to keep it loose for now.
-- But given the error "violates foreign key constraint sessions_spot_id_fkey",
-- simply dropping specific constraint will allow inserting parking_unit IDs.

-- If we want to be strict and say spot_id NOW references parking_units:
-- alter table sessions add constraint sessions_parking_unit_id_fkey 
-- foreign key (spot_id) references parking_units(id);
-- BUT, this would fail if we have existing sessions pointing to old 'spots'.

-- SAFEST FIX: Just drop the constraint for now to allow the application to work.
