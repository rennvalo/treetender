
-- Create a table to hold care parameters for each tree species
CREATE TABLE public.care_parameters (
    id SERIAL PRIMARY KEY,
    species_id INTEGER NOT NULL UNIQUE REFERENCES public.tree_species(id) ON DELETE CASCADE,
    interval_hours INTEGER NOT NULL DEFAULT 12,
    min_water INTEGER NOT NULL DEFAULT 1,
    max_water INTEGER NOT NULL DEFAULT 3,
    min_sunlight INTEGER NOT NULL DEFAULT 1,
    max_sunlight INTEGER NOT NULL DEFAULT 3,
    min_feed INTEGER NOT NULL DEFAULT 1,
    max_feed INTEGER NOT NULL DEFAULT 2,
    min_love INTEGER NOT NULL DEFAULT 1,
    max_love INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.care_parameters ENABLE ROW LEVEL SECURITY;

-- Policies for care_parameters
CREATE POLICY "Care parameters are publicly viewable" ON public.care_parameters FOR SELECT USING (true);
-- For now, any authenticated user can change these. We will create an admin role later.
CREATE POLICY "Authenticated users can manage care parameters" ON public.care_parameters FOR ALL USING (auth.role() = 'authenticated');

-- Populate parameters for existing species
INSERT INTO public.care_parameters (species_id, min_water, max_water, min_sunlight, max_sunlight, min_feed, max_feed, min_love, max_love)
VALUES
  ((SELECT id from public.tree_species WHERE name = 'Oak'), 1, 4, 1, 3, 1, 2, 1, 3),
  ((SELECT id from public.tree_species WHERE name = 'Pine'), 1, 3, 1, 4, 1, 1, 1, 2),
  ((SELECT id from public.tree_species WHERE name = 'Cherry Blossom'), 1, 2, 1, 2, 1, 2, 1, 5);
