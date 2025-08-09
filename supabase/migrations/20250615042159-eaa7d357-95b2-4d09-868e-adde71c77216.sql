
-- Add columns to store the current random targets for each care type
ALTER TABLE trees 
ADD COLUMN target_water INTEGER DEFAULT floor(random() * 15 + 1),
ADD COLUMN target_sunlight INTEGER DEFAULT floor(random() * 15 + 1),
ADD COLUMN target_feed INTEGER DEFAULT floor(random() * 15 + 1),
ADD COLUMN target_love INTEGER DEFAULT floor(random() * 15 + 1);

-- Update the evaluation function to use random targets and generate new ones each round
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
BEGIN
    twelve_hours_ago := now() - INTERVAL '12 hours';
    
    -- Loop through all trees
    FOR tree_record IN 
        SELECT t.*, ts.name as species_name
        FROM trees t
        JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.last_evaluation <= twelve_hours_ago
    LOOP
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
        
        -- Calculate points for each care type using current targets
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
            
            RAISE NOTICE 'Tree % advanced to next stage with % points. New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, total_points, 
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
            
            RAISE NOTICE 'Tree % earned % points (total: %). New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, points_earned, total_points,
                (SELECT target_water FROM trees WHERE id = tree_record.id),
                (SELECT target_sunlight FROM trees WHERE id = tree_record.id),
                (SELECT target_feed FROM trees WHERE id = tree_record.id),
                (SELECT target_love FROM trees WHERE id = tree_record.id);
        END IF;
    END LOOP;
END;
$$;
