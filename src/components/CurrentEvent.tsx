import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, TreeEvent as ApiTreeEvent } from "@/lib/api";

interface CurrentEventProps {
  treeId: string;
  refreshKey?: number; // Add prop to force refresh
}

const CurrentEvent = ({ treeId, refreshKey }: CurrentEventProps) => {
  const [currentEvent, setCurrentEvent] = useState<ApiTreeEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🌿 CurrentEvent effect: treeId", treeId, "refreshKey", refreshKey);
    const fetchLatestEvent = async () => {
      try {
        console.log("🎯 CurrentEvent: Fetching latest event for tree:", treeId, "refreshKey:", refreshKey);
        
  const data = await api.getCurrentEvent(Number(treeId));
  setCurrentEvent(data);
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

  const formatEventChanges = (event: ApiTreeEvent) => {
    const changes = [];
    if (typeof event.water_change === 'number' && event.water_change !== 0) {
      changes.push(`💧 ${event.water_change > 0 ? '+' : ''}${event.water_change}`);
    }
    if (typeof event.sunlight_change === 'number' && event.sunlight_change !== 0) {
      changes.push(`☀️ ${event.sunlight_change > 0 ? '+' : ''}${event.sunlight_change}`);
    }
    if (typeof event.feed_change === 'number' && event.feed_change !== 0) {
      changes.push(`🍎 ${event.feed_change > 0 ? '+' : ''}${event.feed_change}`);
    }
    if (typeof event.love_change === 'number' && event.love_change !== 0) {
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
            {currentEvent.random_event?.emoji || '🌿'}
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-purple-900">
                {currentEvent.random_event?.name || currentEvent.event_type || 'Event'}
              </h3>
              <Badge className={getHealthBadgeColor(currentEvent.random_event?.health_impact || undefined)}>
                {currentEvent.random_event?.health_impact || 'neutral'}
              </Badge>
            </div>
            <p className="text-sm text-purple-700 mb-2">
              {currentEvent.random_event?.description || currentEvent.description || 'Something happened to your tree.'}
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
