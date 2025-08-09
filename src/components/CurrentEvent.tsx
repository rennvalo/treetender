import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

type TreeEvent = Tables<'tree_events'> & {
  random_events: Tables<'random_events'> | null;
};

interface CurrentEventProps {
  treeId: string;
  refreshKey?: number; // Add prop to force refresh
}

const CurrentEvent = ({ treeId, refreshKey }: CurrentEventProps) => {
  const [currentEvent, setCurrentEvent] = useState<TreeEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🌿 CurrentEvent effect: treeId", treeId, "refreshKey", refreshKey);
    const fetchLatestEvent = async () => {
      try {
        console.log("🎯 CurrentEvent: Fetching latest event for tree:", treeId, "refreshKey:", refreshKey);
        
        // Get the most recent event for this tree
        const { data, error } = await supabase
          .from('tree_events')
          .select(`
            *,
            random_events (*)
          `)
          .eq('tree_id', treeId)
          .order('occurred_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error("❌ Error fetching latest event:", error);
          return;
        }

        console.log("✅ Latest event data:", data);

        if (data && data.length > 0) {
          setCurrentEvent(data[0]);
        } else {
          setCurrentEvent(null);
        }
      } catch (error) {
        console.error("❌ Error fetching latest event:", error);
      } finally {
        setLoading(false);
      }
    };

    if (treeId) {
      fetchLatestEvent();
    }
  }, [treeId, refreshKey]);

  const getHealthBadgeColor = (healthImpact?: string) => {
    switch (healthImpact) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventChanges = (event: TreeEvent) => {
    const changes = [];
    if (event.water_change !== 0) {
      changes.push(`💧 ${event.water_change > 0 ? '+' : ''}${event.water_change}`);
    }
    if (event.sunlight_change !== 0) {
      changes.push(`☀️ ${event.sunlight_change > 0 ? '+' : ''}${event.sunlight_change}`);
    }
    if (event.feed_change !== 0) {
      changes.push(`🍎 ${event.feed_change > 0 ? '+' : ''}${event.feed_change}`);
    }
    if (event.love_change !== 0) {
      changes.push(`❤️ ${event.love_change > 0 ? '+' : ''}${event.love_change}`);
    }
    return changes.join(' ');
  };

  if (loading || !currentEvent) {
    return null;
  }

  const hasEffects = currentEvent.water_change !== 0 || 
                   currentEvent.sunlight_change !== 0 || 
                   currentEvent.feed_change !== 0 || 
                   currentEvent.love_change !== 0;

  return (
    <Card className="border-2 border-dashed border-purple-200 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {currentEvent.random_events?.emoji || '🌿'}
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-purple-900">
                {currentEvent.random_events?.name || 'Weather Event'}
              </h3>
              <Badge className={getHealthBadgeColor(currentEvent.random_events?.health_impact)}>
                {currentEvent.random_events?.health_impact || 'neutral'}
              </Badge>
            </div>
            <p className="text-sm text-purple-700 mb-2">
              {currentEvent.random_events?.description || 'Something is happening to your tree!'}
            </p>
            {hasEffects && (
              <div className="text-sm font-medium text-purple-800">
                Effects: {formatEventChanges(currentEvent)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentEvent;
