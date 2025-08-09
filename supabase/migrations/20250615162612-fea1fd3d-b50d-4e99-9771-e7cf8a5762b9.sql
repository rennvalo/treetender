
-- Add a column to track last user activity on trees
ALTER TABLE trees 
ADD COLUMN last_user_activity TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the evaluation function to include inactivity penalties
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
    inactivity_penalty INTEGER;
BEGIN
    twelve_hours_ago := now() - INTERVAL '12 hours';
    
    -- Loop through all trees
    FOR tree_record IN 
        SELECT t.*, ts.name as species_name
        FROM trees t
        JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.last_evaluation <= twelve_hours_ago
    LOOP
        -- Calculate inactivity penalty (lose 5 points for every 12-hour period of inactivity)
        inactivity_penalty := 0;
        IF tree_record.last_user_activity < twelve_hours_ago THEN
            -- Calculate how many 12-hour periods since last activity
            inactivity_penalty := EXTRACT(EPOCH FROM (now() - tree_record.last_user_activity))::INTEGER / (12 * 3600) * 5;
            inactivity_penalty := LEAST(inactivity_penalty, tree_record.growth_points); -- Don't go below 0
        END IF;
        
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
        
        -- Apply inactivity penalty and calculate total points
        total_points := GREATEST(0, tree_record.growth_points - inactivity_penalty + points_earned);
        
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
            
            RAISE NOTICE 'Tree % advanced to next stage with % points (penalty: %). Event: % (% % % %). New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, total_points, inactivity_penalty, random_event.name,
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
            
            RAISE NOTICE 'Tree % earned % points (total: %, penalty: %). Event: % (% % % %). New targets: W:%, S:%, F:%, L:%', 
                tree_record.id, points_earned, total_points, inactivity_penalty, random_event.name,
                event_water_change, event_sunlight_change, event_feed_change, event_love_change,
                (SELECT target_water FROM trees WHERE id = tree_record.id),
                (SELECT target_sunlight FROM trees WHERE id = tree_record.id),
                (SELECT target_feed FROM trees WHERE id = tree_record.id),
                (SELECT target_love FROM trees WHERE id = tree_record.id);
        END IF;
    END LOOP;
END;
$$;
