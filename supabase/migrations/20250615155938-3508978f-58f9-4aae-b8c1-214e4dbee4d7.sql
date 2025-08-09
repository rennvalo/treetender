
-- Create a table to store random events that can occur
CREATE TABLE public.random_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT,
  water_modifier INTEGER DEFAULT 0,
  sunlight_modifier INTEGER DEFAULT 0,
  feed_modifier INTEGER DEFAULT 0,
  love_modifier INTEGER DEFAULT 0,
  health_impact TEXT DEFAULT 'neutral', -- 'positive', 'negative', 'neutral'
  rarity INTEGER DEFAULT 50, -- 1-100, higher means more common
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a table to track which events happened to which trees
CREATE TABLE public.tree_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID REFERENCES public.trees(id) NOT NULL,
  event_id INTEGER REFERENCES public.random_events(id) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  water_change INTEGER DEFAULT 0,
  sunlight_change INTEGER DEFAULT 0,
  feed_change INTEGER DEFAULT 0,
  love_change INTEGER DEFAULT 0
);

-- Insert some exciting random events
INSERT INTO public.random_events (name, description, emoji, water_modifier, sunlight_modifier, feed_modifier, love_modifier, health_impact, rarity) VALUES
('Heavy Rain', 'A downpour has given your tree plenty of water!', '🌧️', 3, 0, 0, 0, 'positive', 30),
('Sunny Day', 'Beautiful sunshine has energized your tree!', '☀️', 0, 3, 0, 0, 'positive', 35),
('Spring Shower', 'A gentle rain has refreshed your tree.', '🌦️', 2, 1, 0, 1, 'positive', 40),
('Perfect Weather', 'Ideal conditions have blessed your tree!', '🌤️', 1, 2, 1, 2, 'positive', 20),
('Windstorm', 'Strong winds have stressed your tree.', '💨', -1, -1, 0, -2, 'negative', 25),
('Drought', 'Lack of rain has left your tree thirsty.', '🏜️', -3, 0, -1, 0, 'negative', 15),
('Forest Fire Nearby', 'Smoke and heat have damaged your tree!', '🔥', -2, -3, -2, -3, 'negative', 5),
('Earthquake', 'Ground shaking has disturbed your tree''s roots.', '🌍', -1, 0, -2, -2, 'negative', 8),
('Visiting Birds', 'Friendly birds have brought joy to your tree!', '🐦', 0, 0, 1, 3, 'positive', 45),
('Pollinator Swarm', 'Bees and butterflies are helping your tree thrive!', '🦋', 0, 1, 2, 2, 'positive', 30),
('Morning Dew', 'Fresh dew has provided gentle moisture.', '💧', 1, 0, 0, 1, 'positive', 50),
('Harsh Frost', 'Cold temperatures have shocked your tree.', '❄️', 0, -2, -1, -1, 'negative', 20),
('Hailstorm', 'Ice pellets have battered your tree!', '🧊', -1, -2, 0, -2, 'negative', 10),
('Rainbow', 'A beautiful rainbow has lifted your tree''s spirits!', '🌈', 0, 1, 0, 3, 'positive', 15),
('Gentle Breeze', 'A soft wind has brought fresh air to your tree.', '🍃', 0, 1, 0, 1, 'positive', 60),
('Thunderstorm', 'Lightning and thunder have frightened your tree.', '⛈️', 2, -1, 0, -2, 'negative', 20),
('Fog Bank', 'Thick fog has provided humidity but blocked sun.', '🌫️', 1, -2, 0, 0, 'neutral', 25),
('Heat Wave', 'Extreme heat has stressed your tree severely.', '🥵', -2, -1, -1, -1, 'negative', 12),
('Snow Day', 'Peaceful snow has blanketed your tree.', '❄️', 1, -1, 0, 1, 'neutral', 18),
('Meteor Shower', 'Shooting stars have inspired your tree!', '☄️', 0, 0, 1, 4, 'positive', 5);

-- Add RLS policies for the new tables
ALTER TABLE public.random_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read random events (they're game data)
CREATE POLICY "Everyone can read random events" ON public.random_events FOR SELECT USING (true);

-- Users can only see events for their own trees
CREATE POLICY "Users can view their tree events" ON public.tree_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.trees WHERE trees.id = tree_events.tree_id AND trees.user_id = auth.uid()));

-- System can insert tree events (for the evaluation function)
CREATE POLICY "System can insert tree events" ON public.tree_events FOR INSERT WITH CHECK (true);

-- Update the tree evaluation function to include random events
CREATE OR REPLACE FUNCTION evaluate_tree_growth()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    tree_record RECORD;
    care_counts RECORD;
    points_earned INTEGER;
    total_points INTEGER;
    twelve_hours_ago TIMESTAMP WITH TIME ZONE;
    random_event RECORD;
    event_water_change INTEGER;
    event_sunlight_change INTEGER;
    event_feed_change INTEGER;
    event_love_change INTEGER;
BEGIN
    twelve_hours_ago := now() - INTERVAL '12 hours';
    
    -- Loop through all trees
    FOR tree_record IN 
        SELECT t.*, ts.name as species_name
        FROM trees t
        JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.last_evaluation <= twelve_hours_ago
    LOOP
        -- Select a random event based on rarity (weighted random)
        SELECT * INTO random_event
        FROM random_events
        WHERE random() * 100 <= rarity
        ORDER BY random()
        LIMIT 1;
        
        -- If no event was selected, pick a common one
        IF random_event IS NULL THEN
            SELECT * INTO random_event
            FROM random_events
            WHERE rarity >= 40
            ORDER BY random()
            LIMIT 1;
        END IF;
        
        -- Calculate event effects
        event_water_change := random_event.water_modifier;
        event_sunlight_change := random_event.sunlight_modifier;
        event_feed_change := random_event.feed_modifier;
        event_love_change := random_event.love_modifier;
        
        -- Count care actions since last evaluation
        SELECT 
            COALESCE(SUM(CASE WHEN action_type = 'water' THEN 1 ELSE 0 END), 0) as water_count,
            COALESCE(SUM(CASE WHEN action_type = 'sunlight' THEN 1 ELSE 0 END), 0) as sunlight_count,
            COALESCE(SUM(CASE WHEN action_type = 'feed' THEN 1 ELSE 0 END), 0) as feed_count,
            COALESCE(SUM(CASE WHEN action_type = 'love' THEN 1 ELSE 0 END), 0) as love_count
        INTO care_counts
        FROM care_logs
        WHERE tree_id = tree_record.id 
        AND created_at > tree_record.last_evaluation;
        
        -- Apply event effects to care counts (but don't let them go below 0)
        care_counts.water_count := GREATEST(0, care_counts.water_count + event_water_change);
        care_counts.sunlight_count := GREATEST(0, care_counts.sunlight_count + event_sunlight_change);
        care_counts.feed_count := GREATEST(0, care_counts.feed_count + event_feed_change);
        care_counts.love_count := GREATEST(0, care_counts.love_count + event_love_change);
        
        -- Calculate points for each care type using current targets (with event effects)
        points_earned := 0;
        
        -- Water points
        IF care_counts.water_count = tree_record.target_water THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.water_count;
        END IF;
        
        -- Sunlight points
        IF care_counts.sunlight_count = tree_record.target_sunlight THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.sunlight_count;
        END IF;
        
        -- Feed points
        IF care_counts.feed_count = tree_record.target_feed THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.feed_count;
        END IF;
        
        -- Love points
        IF care_counts.love_count = tree_record.target_love THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.love_count;
        END IF;
        
        -- Record the event that occurred
        INSERT INTO tree_events (tree_id, event_id, water_change, sunlight_change, feed_change, love_change)
        VALUES (tree_record.id, random_event.id, event_water_change, event_sunlight_change, event_feed_change, event_love_change);
        
        -- Update tree with new points and generate new random targets for next round
        total_points := tree_record.growth_points + points_earned;
        
        -- Check for growth stage advancement
        IF total_points >= 100 THEN
            -- Advance growth stage and reset points, set new random targets
            UPDATE trees 
            SET growth_points = total_points - 100,
                last_evaluation = now(),
                growth_stage = CASE 
                    WHEN growth_stage = 'seedling' THEN 'sprout'
                    WHEN growth_stage = 'sprout' THEN 'sapling'
                    WHEN growth_stage = 'sapling' THEN 'full_tree'
                    ELSE growth_stage
                END,
                target_water = floor(random() * 15 + 1),
                target_sunlight = floor(random() * 15 + 1),
                target_feed = floor(random() * 15 + 1),
                target_love = floor(random() * 15 + 1)
            WHERE id = tree_record.id;
            
            RAISE NOTICE 'Tree % advanced to next stage with % points. Event: % (% % % %). New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, total_points, random_event.name,
                event_water_change, event_sunlight_change, event_feed_change, event_love_change,
                (SELECT target_water FROM trees WHERE id = tree_record.id),
                (SELECT target_sunlight FROM trees WHERE id = tree_record.id),
                (SELECT target_feed FROM trees WHERE id = tree_record.id),
                (SELECT target_love FROM trees WHERE id = tree_record.id);
        ELSE
            -- Just update points, evaluation time, and set new random targets
            UPDATE trees 
            SET growth_points = total_points,
                last_evaluation = now(),
                target_water = floor(random() * 15 + 1),
                target_sunlight = floor(random() * 15 + 1),
                target_feed = floor(random() * 15 + 1),
                target_love = floor(random() * 15 + 1)
            WHERE id = tree_record.id;
            
            RAISE NOTICE 'Tree % earned % points (total: %). Event: % (% % % %). New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, points_earned, total_points, random_event.name,
                event_water_change, event_sunlight_change, event_feed_change, event_love_change,
                (SELECT target_water FROM trees WHERE id = tree_record.id),
                (SELECT target_sunlight FROM trees WHERE id = tree_record.id),
                (SELECT target_feed FROM trees WHERE id = tree_record.id),
                (SELECT target_love FROM trees WHERE id = tree_record.id);
        END IF;
    END LOOP;
END;
$$;
