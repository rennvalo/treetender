
-- Add columns to track growth points and last evaluation
ALTER TABLE trees 
ADD COLUMN growth_points INTEGER DEFAULT 0,
ADD COLUMN last_evaluation TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a function to evaluate tree growth based on care actions
CREATE OR REPLACE FUNCTION evaluate_tree_growth()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    tree_record RECORD;
    care_counts RECORD;
    params RECORD;
    points_earned INTEGER;
    total_points INTEGER;
    twelve_hours_ago TIMESTAMP WITH TIME ZONE;
BEGIN
    twelve_hours_ago := now() - INTERVAL '12 hours';
    
    -- Loop through all trees
    FOR tree_record IN 
        SELECT t.*, ts.name as species_name
        FROM trees t
        JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.last_evaluation <= twelve_hours_ago
    LOOP
        -- Get care parameters for this tree species
        SELECT * INTO params
        FROM care_parameters
        WHERE species_id = tree_record.species_id;
        
        IF params IS NULL THEN
            CONTINUE; -- Skip if no parameters defined
        END IF;
        
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
        
        -- Calculate points for each care type
        points_earned := 0;
        
        -- Water points
        IF care_counts.water_count >= params.min_water AND care_counts.water_count <= params.max_water THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.water_count;
        END IF;
        
        -- Sunlight points
        IF care_counts.sunlight_count >= params.min_sunlight AND care_counts.sunlight_count <= params.max_sunlight THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.sunlight_count;
        END IF;
        
        -- Feed points
        IF care_counts.feed_count >= params.min_feed AND care_counts.feed_count <= params.max_feed THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.feed_count;
        END IF;
        
        -- Love points
        IF care_counts.love_count >= params.min_love AND care_counts.love_count <= params.max_love THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.love_count;
        END IF;
        
        -- Update tree with new points
        total_points := tree_record.growth_points + points_earned;
        
        -- Check for growth stage advancement
        IF total_points >= 100 THEN
            -- Advance growth stage and reset points
            UPDATE trees 
            SET growth_points = total_points - 100,
                last_evaluation = now(),
                growth_stage = CASE 
                    WHEN growth_stage = 'seedling' THEN 'sprout'
                    WHEN growth_stage = 'sprout' THEN 'sapling'
                    WHEN growth_stage = 'sapling' THEN 'full_tree'
                    ELSE growth_stage
                END
            WHERE id = tree_record.id;
            
            RAISE NOTICE 'Tree % advanced to next stage with % points', tree_record.id, total_points;
        ELSE
            -- Just update points and evaluation time
            UPDATE trees 
            SET growth_points = total_points,
                last_evaluation = now()
            WHERE id = tree_record.id;
            
            RAISE NOTICE 'Tree % earned % points (total: %)', tree_record.id, points_earned, total_points;
        END IF;
    END LOOP;
END;
$$;
