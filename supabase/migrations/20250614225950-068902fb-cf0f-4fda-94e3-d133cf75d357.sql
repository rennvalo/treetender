
-- Create an enum type for the different growth stages of a tree
CREATE TYPE public.growth_stage AS ENUM ('seedling', 'sprout', 'sapling', 'full_tree');

-- Create an enum type for the different care actions
CREATE TYPE public.care_action AS ENUM ('water', 'feed');

-- Create a table to hold the different species of trees
CREATE TABLE public.tree_species (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_seedling TEXT,
    image_sprout TEXT,
    image_sapling TEXT,
    image_full_tree TEXT
);

-- Create a table for user profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the main table for user-owned trees
CREATE TABLE public.trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    species_id INTEGER NOT NULL REFERENCES public.tree_species(id),
    growth_stage public.growth_stage NOT NULL DEFAULT 'seedling',
    planted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a table to log care actions for each tree
CREATE TABLE public.care_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
    action_type public.care_action NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add some default tree species to the database
INSERT INTO public.tree_species (name, description, image_seedling, image_sprout, image_sapling, image_full_tree) VALUES
('Oak', 'A mighty oak, symbol of strength and endurance.', 'https://images.unsplash.com/photo-1626576313933-28495a8f6256?q=80&w=1200', 'https://images.unsplash.com/photo-1525923838299-291245458361?q=80&w=1200', 'https://images.unsplash.com/photo-1563234993-4122514e823b?q=80&w=1200', 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200'),
('Pine', 'A tall pine, resilient and evergreen.', 'https://images.unsplash.com/photo-1588775434313-054483a9c9f3?q=80&w=1200', 'https://images.unsplash.com/photo-1509316588-158718a24c3a?q=80&w=1200', 'https://images.unsplash.com/photo-1459411552884-943e9439d7d6?q=80&w=1200', 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200'),
('Cherry Blossom', 'A beautiful sakura, heralding the arrival of spring.', 'https://images.unsplash.com/photo-1586947473727-950924e53b6f?q=80&w=1200', 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1200', 'https://images.unsplash.com/photo-1553234191-a619f7b600d8?q=80&w=1200', 'https://images.unsplash.com/photo-1584285418195-021c76063428?q=80&w=1200');

-- Set up Row Level Security for all tables
ALTER TABLE public.tree_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tree species are publicly viewable" ON public.tree_species FOR SELECT USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tree" ON public.trees FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own care logs" ON public.care_logs FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.trees WHERE id = tree_id));
CREATE POLICY "Users can insert their own care logs" ON public.care_logs FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.trees WHERE id = tree_id));

-- Function to automatically create a profile and assign a tree to a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    random_species_id int;
BEGIN
    -- Create a profile for the new user
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, new.raw_user_meta_data->>'username');

    -- Select a random species id
    SELECT id INTO random_species_id FROM public.tree_species ORDER BY random() LIMIT 1;
    
    -- Assign the random tree to the new user
    INSERT INTO public.trees (user_id, species_id)
    VALUES (new.id, random_species_id);
    
    RETURN new;
END;
$$;

-- Trigger the function on every new user sign-up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

