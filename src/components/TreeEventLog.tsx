import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { api, TreeEvent as ApiTreeEvent } from "@/lib/api";

interface TreeEventLogProps {
  treeId: string;
  refreshKey?: number; // Add prop to force refresh
}

const TreeEventLog = ({ treeId, refreshKey }: TreeEventLogProps) => {
  const [events, setEvents] = useState<ApiTreeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🪵 TreeEventLog effect: treeId", treeId, "refreshKey", refreshKey);
    const fetchTreeEvents = async () => {
      try {
        console.log("📜 TreeEventLog: Fetching events for tree:", treeId, "refreshKey:", refreshKey);
        
  const data = await api.getTreeEvents(Number(treeId), 10);
  console.log("✅ Tree events data:", data);
  setEvents(data || []);
      } catch (error) {
        console.error("❌ Error fetching tree events:", error);
      } finally {
        setLoading(false);
      }
    };

    if (treeId) {
      fetchTreeEvents();
    }
  }, [treeId, refreshKey]);

  const getHealthBadgeColor = (healthImpact?: string) => {
    switch (healthImpact) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventChanges = (event: ApiTreeEvent) => {
    const parts: string[] = [];
    // Show point change first if present and non-zero
    if (typeof event.point_change === 'number' && event.point_change !== 0) {
      parts.push(`${event.point_change > 0 ? '+' : ''}${event.point_change} pts`);
    }
    if (typeof event.water_change === 'number' && event.water_change !== 0) {
      parts.push(`💧 ${event.water_change > 0 ? '+' : ''}${event.water_change}`);
    }
    if (typeof event.sunlight_change === 'number' && event.sunlight_change !== 0) {
      parts.push(`☀️ ${event.sunlight_change > 0 ? '+' : ''}${event.sunlight_change}`);
    }
    if (typeof event.feed_change === 'number' && event.feed_change !== 0) {
      parts.push(`🍎 ${event.feed_change > 0 ? '+' : ''}${event.feed_change}`);
    }
    if (typeof event.love_change === 'number' && event.love_change !== 0) {
      parts.push(`❤️ ${event.love_change > 0 ? '+' : ''}${event.love_change}`);
    }
    return parts.join(' ');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🌟</span>
          <span>Recent Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events yet. Your tree's journey is just beginning!</p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-2xl flex-shrink-0">
                    {event.random_event?.emoji || '🌿'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {event.random_event?.name || event.event_type || 'Unknown Event'}
                      </h4>
                      <Badge className={`text-xs ${getHealthBadgeColor(event.random_event?.health_impact || undefined)}`}>
                        {event.random_event?.health_impact || 'neutral'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {event.random_event?.description || event.description || 'Something happened to your tree.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-600">
                        {formatEventChanges(event)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {event.occurred_at ? formatTimeAgo(event.occurred_at) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TreeEventLog;
