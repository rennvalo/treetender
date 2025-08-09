
-- Drop and recreate the evaluate_tree_growth function to accept a force parameter
DROP FUNCTION IF EXISTS evaluate_tree_growth();

CREATE OR REPLACE FUNCTION evaluate_tree_growth(force_evaluation BOOLEAN DEFAULT FALSE)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    tree_record RECORD;
    care_counts RECORD;
    points_earned INTEGER;
    new_stage growth_stage;
    penalty_amount INTEGER;
    hours_inactive INTEGER;
    care_params RECORD;
    evaluation_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set evaluation cutoff based on force parameter
    IF force_evaluation THEN
        evaluation_cutoff := '1970-01-01'::TIMESTAMP WITH TIME ZONE; -- Always process all trees
        RAISE NOTICE 'Running FORCED evaluation for all trees';
    ELSE
        evaluation_cutoff := NOW() - INTERVAL '12 hours';
        RAISE NOTICE 'Running scheduled evaluation for trees older than 12 hours';
    END IF;
    
    -- Loop through trees based on evaluation cutoff
    FOR tree_record IN 
        SELECT t.*, ts.name as species_name
        FROM trees t
        JOIN tree_species ts ON t.species_id = ts.id
        WHERE t.last_evaluation < evaluation_cutoff
    LOOP
        RAISE NOTICE 'Evaluating tree %: current stage %, points %', 
            tree_record.id, tree_record.growth_stage, tree_record.growth_points;
        
        -- Get care parameters for this species
        SELECT * INTO care_params
        FROM care_parameters 
        WHERE species_id = tree_record.species_id;
        
        -- Count care actions since last evaluation
        SELECT 
            COALESCE(SUM(CASE WHEN action_type = 'water' THEN 1 ELSE 0 END), 0) as water_count,
            COALESCE(SUM(CASE WHEN action_type = 'sunlight' THEN 1 ELSE 0 END), 0) as sunlight_count,
            COALESCE(SUM(CASE WHEN action_type = 'feed' THEN 1 ELSE 0 END), 0) as feed_count,
            COALESCE(SUM(CASE WHEN action_type = 'love' THEN 1 ELSE 0 END), 0) as love_count
        INTO care_counts
        FROM care_logs 
        WHERE tree_id = tree_record.id 
        AND created_at >= tree_record.last_evaluation;
        
        RAISE NOTICE 'Care counts - Water: %, Sunlight: %, Feed: %, Love: %',
            care_counts.water_count, care_counts.sunlight_count, 
            care_counts.feed_count, care_counts.love_count;
        
        -- Calculate points earned
        points_earned := 0;
        
        -- Water points (25 if exact match, 1 per action otherwise)
        IF care_counts.water_count = COALESCE(tree_record.target_water, 0) THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.water_count;
        END IF;
        
        -- Sunlight points
        IF care_counts.sunlight_count = COALESCE(tree_record.target_sunlight, 0) THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.sunlight_count;
        END IF;
        
        -- Feed points
        IF care_counts.feed_count = COALESCE(tree_record.target_feed, 0) THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.feed_count;
        END IF;
        
        -- Love points
        IF care_counts.love_count = COALESCE(tree_record.target_love, 0) THEN
            points_earned := points_earned + 25;
        ELSE
            points_earned := points_earned + care_counts.love_count;
        END IF;
        
        RAISE NOTICE 'Points earned this round: %', points_earned;
        
        -- Calculate inactivity penalty
        penalty_amount := 0;
        IF tree_record.last_user_activity IS NOT NULL THEN
            hours_inactive := EXTRACT(EPOCH FROM (NOW() - tree_record.last_user_activity)) / 3600;
            IF hours_inactive > 12 THEN
                penalty_amount := LEAST(
                    ((hours_inactive::INTEGER / 12) * 5), 
                    COALESCE(tree_record.growth_points, 0)
                );
            END IF;
        END IF;
        
        RAISE NOTICE 'Inactivity penalty: %', penalty_amount;
        
        -- Calculate new total points
        points_earned := GREATEST(0, 
            COALESCE(tree_record.growth_points, 0) + points_earned - penalty_amount
        );
        
        RAISE NOTICE 'New total points: %', points_earned;
        
        -- Determine new stage based on points and current stage
        new_stage := tree_record.growth_stage;
        
        -- Stage advancement logic - advance if points >= 100
        IF points_earned >= 100 THEN
            CASE tree_record.growth_stage
                WHEN 'seedling' THEN 
                    new_stage := 'sprout';
                    points_earned := points_earned - 100; -- Reset points after advancement
                WHEN 'sprout' THEN 
                    new_stage := 'sapling';
                    points_earned := points_earned - 100;
                WHEN 'sapling' THEN 
                    new_stage := 'full_tree';
                    points_earned := points_earned - 100;
                WHEN 'full_tree' THEN 
                    -- Already at max stage, keep points
                    NULL;
            END CASE;
        END IF;
        
        RAISE NOTICE 'Stage advancement: % -> %, final points: %', 
            tree_record.growth_stage, new_stage, points_earned;
        
        -- Generate new random targets if care_params exist
        IF care_params IS NOT NULL THEN
            UPDATE trees SET
                growth_points = points_earned,
                growth_stage = new_stage,
                last_evaluation = NOW(),
                target_water = FLOOR(RANDOM() * (care_params.max_water - care_params.min_water + 1)) + care_params.min_water,
                target_sunlight = FLOOR(RANDOM() * (care_params.max_sunlight - care_params.min_sunlight + 1)) + care_params.min_sunlight,
                target_feed = FLOOR(RANDOM() * (care_params.max_feed - care_params.min_feed + 1)) + care_params.min_feed,
                target_love = FLOOR(RANDOM() * (care_params.max_love - care_params.min_love + 1)) + care_params.min_love
            WHERE id = tree_record.id;
        ELSE
            -- Fallback if no care parameters
            UPDATE trees SET
                growth_points = points_earned,
                growth_stage = new_stage,
                last_evaluation = NOW(),
                target_water = FLOOR(RANDOM() * 10) + 5,
                target_sunlight = FLOOR(RANDOM() * 10) + 5,
                target_feed = FLOOR(RANDOM() * 10) + 5,
                target_love = FLOOR(RANDOM() * 10) + 5
            WHERE id = tree_record.id;
        END IF;
        
        RAISE NOTICE 'Tree % evaluation complete. Final stage: %, points: %', 
            tree_record.id, new_stage, points_earned;
            
    END LOOP;
    
    RAISE NOTICE 'Tree evaluation function completed';
END;
$$;
