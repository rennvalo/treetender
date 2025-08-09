import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User } from "@supabase/supabase-js";
import { Leaf, Droplet, Sun, Apple, Heart, Cog, Shield, Star, Target, Clock } from "lucide-react";
import { Tables, Enums } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";
import { AdminPanel } from "@/components/AdminPanel";
import TreeGrowthStages from "@/components/TreeGrowthStages";
import CelebrationModal from "@/components/CelebrationModal";
import TreeEventLog from "@/components/TreeEventLog";
import CurrentEvent from "@/components/CurrentEvent";

// Extended types to include new functionality
type TreeWithDetails = Tables<'trees'> & {
  tree_species: Tables<'tree_species'> | null;
  health?: 'thriving' | 'healthy' | 'struggling' | 'dying';
};

type CareActionCounts = {
  water: number;
  sunlight: number;
  feed: number;
  love: number;
};

const ADMIN_EMAIL = "renn.co@gmail.com";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tree, setTree] = useState<TreeWithDetails | null>(null);
  const [careActionCounts, setCareActionCounts] = useState<CareActionCounts>({
    water: 0,
    sunlight: 0,
    feed: 0,
    love: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCaring, setIsCaring] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [treeUpdateKey, setTreeUpdateKey] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Update user activity when component loads
  useEffect(() => {
    if (user) {
      updateUserActivity();
    }
  }, [user]);

  const updateUserActivity = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('trees')
        .update({ last_user_activity: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error updating user activity:", error);
      }
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  };

  const fetchTreeData = async () => {
    if (!user) return null;
    
    console.log("🌳 Fetching fresh tree data...");
    const { data: treeData, error: treeError } = await supabase
      .from('trees')
      .select('*, tree_species(*)')
      .eq('user_id', user.id)
      .single();

    if (treeError) {
      console.error("❌ Error fetching tree:", treeError.message);
      return null;
    }

    console.log("✅ Fresh tree data fetched:", {
      id: treeData.id,
      stage: treeData.growth_stage,
      points: treeData.growth_points,
      targets: {
        water: treeData.target_water,
        sunlight: treeData.target_sunlight,
        feed: treeData.target_feed,
        love: treeData.target_love
      }
    });
    
    return treeData;
  };

  const loadTreeAndCareData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const treeData = await fetchTreeData();
    if (treeData) {
      console.log("🔄 Setting tree state with:", {
        stage: treeData.growth_stage,
        points: treeData.growth_points
      });
      
      setTree(treeData);
      setTreeUpdateKey(prev => prev + 1);

      // Fetch care action counts since last evaluation
      const { data: careLogsData } = await supabase
        .from('care_logs')
        .select('action_type')
        .eq('tree_id', treeData.id)
        .gte('created_at', treeData.last_evaluation || new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());

      if (careLogsData) {
        const counts = careLogsData.reduce((acc, log) => {
          acc[log.action_type] = (acc[log.action_type] || 0) + 1;
          return acc;
        }, {} as Partial<CareActionCounts>);

        setCareActionCounts({
          water: counts.water || 0,
          sunlight: counts.sunlight || 0,
          feed: counts.feed || 0,
          love: counts.love || 0
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadTreeAndCareData();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCareAction = async (action: Enums<'care_action'>) => {
    if (!tree) return;
    setIsCaring(true);
    try {
      // Update user activity first
      await updateUserActivity();
      
      const { error } = await supabase.from('care_logs').insert({
        tree_id: tree.id,
        action_type: action,
      });

      if (error) {
        toast.error(`Failed to perform action: ${error.message}`);
        throw error;
      }

      // Update the local count immediately
      setCareActionCounts(prev => ({
        ...prev,
        [action]: prev[action] + 1
      }));

      toast.success(`You've given your tree some ${action}! 🌱`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setIsCaring(false);
    }
  };

  const getTreeImageUrl = (tree: TreeWithDetails): string => {
    console.log("Getting image URL for tree:", tree);
    console.log("Tree species:", tree.tree_species);
    console.log("Growth stage:", tree.growth_stage);
    
    // Default fallback image
    const defaultImage = "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop";
    
    if (!tree.tree_species) {
      console.log("No tree species found, using default image");
      return defaultImage;
    }

    let imageUrl = '';
    switch (tree.growth_stage) {
      case 'seedling':
        imageUrl = tree.tree_species.image_seedling || '';
        break;
      case 'sprout':
        imageUrl = tree.tree_species.image_sprout || '';
        break;
      case 'sapling':
        imageUrl = tree.tree_species.image_sapling || '';
        break;
      case 'full_tree':
        imageUrl = tree.tree_species.image_full_tree || '';
        break;
      default:
        imageUrl = '';
    }
    
    console.log("Selected image URL:", imageUrl);
    
    // Return the selected image URL or fallback to default
    return imageUrl || defaultImage;
  }

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'thriving': return 'text-green-600 bg-green-100';
      case 'healthy': return 'text-blue-600 bg-blue-100';
      case 'struggling': return 'text-yellow-600 bg-yellow-100';
      case 'dying': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateCurrentPoints = () => {
    if (!tree) return 0;
    
    let points = 0;
    
    // Water points - 25 if exact match, otherwise 1 per action
    if (careActionCounts.water === (tree.target_water || 0)) {
      points += 25;
    } else {
      points += careActionCounts.water;
    }
    
    // Sunlight points
    if (careActionCounts.sunlight === (tree.target_sunlight || 0)) {
      points += 25;
    } else {
      points += careActionCounts.sunlight;
    }
    
    // Feed points
    if (careActionCounts.feed === (tree.target_feed || 0)) {
      points += 25;
    } else {
      points += careActionCounts.feed;
    }
    
    // Love points
    if (careActionCounts.love === (tree.target_love || 0)) {
      points += 25;
    } else {
      points += careActionCounts.love;
    }
    
    return points;
  };

  const isTargetHit = (action: string, count: number) => {
    if (!tree) return false;
    
    switch (action) {
      case 'water': return count === (tree.target_water || 0);
      case 'sunlight': return count === (tree.target_sunlight || 0);
      case 'feed': return count === (tree.target_feed || 0);
      case 'love': return count === (tree.target_love || 0);
      default: return false;
    }
  };

  const getTargetRange = (action: string) => {
    if (!tree) return "1-15";
    
    const target = (() => {
      switch (action) {
        case 'water': return tree.target_water || 0;
        case 'sunlight': return tree.target_sunlight || 0;
        case 'feed': return tree.target_feed || 0;
        case 'love': return tree.target_love || 0;
        default: return 0;
      }
    })();
    
    // Show a range of ±3 around the target, but keep it within 1-15
    const min = Math.max(1, target - 3);
    const max = Math.min(15, target + 3);
    
    return `${min}-${max}`;
  };

  const getInactivityWarning = () => {
    if (!tree?.last_user_activity) return null;
    
    const lastActivity = new Date(tree.last_user_activity);
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    if (lastActivity < twelveHoursAgo) {
      const hoursInactive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60));
      const penaltyPeriods = Math.floor(hoursInactive / 12);
      const potentialPenalty = penaltyPeriods * 5;
      
      return {
        hoursInactive,
        potentialPenalty: Math.min(potentialPenalty, tree.growth_points || 0)
      };
    }
    
    return null;
  };

  const runEvaluation = async () => {
    if (!user || !tree || isEvaluating) return;

    setIsEvaluating(true);

    try {
      console.log("🚀 Starting MANUAL tree evaluation...");
      console.log("📊 Before evaluation - Stage:", tree.growth_stage, "Points:", tree.growth_points);

      // Store current stage for comparison
      const previousStage = tree.growth_stage;
      const previousPoints = tree.growth_points || 0;

      // Update user activity before evaluation
      await updateUserActivity();

      // Call the database function with force_evaluation = true for manual evaluations
      console.log("📞 Calling evaluate_tree_growth function with force=true...");
      const { error: functionError } = await supabase.rpc('evaluate_tree_growth', {
        force_evaluation: true
      });

      if (functionError) {
        console.error("❌ Error calling evaluate_tree_growth:", functionError);
        toast.error(`Evaluation failed: ${functionError.message}`);
        return;
      }

      console.log("✅ Database function completed");

      // Wait for server to process the changes
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Force refresh tree data from database multiple times to ensure we get the update
      let updatedTreeData = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!updatedTreeData && attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts} to fetch updated data...`);
        updatedTreeData = await fetchTreeData();

        if (updatedTreeData && (
          updatedTreeData.growth_stage !== previousStage ||
          updatedTreeData.growth_points !== previousPoints
        )) {
          break; // We got updated data
        }

        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!updatedTreeData) {
        toast.error("Failed to fetch updated tree data after evaluation");
        return;
      }

      console.log("🌱 Post-evaluation tree data:", {
        stage: updatedTreeData.growth_stage,
        points: updatedTreeData.growth_points,
        previousStage,
        previousPoints
      });

      // Force update the tree state and re-render everything
      setTree(updatedTreeData);
      setTreeUpdateKey(prev => {
        const nextKey = prev + 1;
        console.log("🔁 treeUpdateKey incremented to", nextKey, "(after evaluation)");
        return nextKey;
      });

      // Reset care action counts for new round
      setCareActionCounts({
        water: 0,
        sunlight: 0,
        feed: 0,
        love: 0
      });

      // Show appropriate messages based on what happened
      if (previousStage !== updatedTreeData.growth_stage) {
        console.log(`🎉 Tree advanced from ${previousStage} to ${updatedTreeData.growth_stage}!`);
        toast.success(`🎉 Your tree has grown from ${previousStage} to ${updatedTreeData.growth_stage}!`);

        // Show celebration if tree reached full_tree
        if (updatedTreeData.growth_stage === 'full_tree') {
          setTimeout(() => {
            setShowCelebration(true);
          }, 1000);
        }
      } else if (previousPoints !== updatedTreeData.growth_points) {
        toast.success(`Evaluation complete! Your tree now has ${updatedTreeData.growth_points} points.`);
      } else {
        toast.success(`Evaluation complete! Your tree earned points and new targets have been set.`);
      }

    } catch (error) {
      console.error("❌ Error running evaluation:", error);
      toast.error("Failed to run evaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  const inactivityWarning = getInactivityWarning();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Leaf className="h-12 w-12 text-green-600 animate-spin" />
      </div>
    );
  }

  const currentPoints = calculateCurrentPoints();
  const totalPoints = (tree?.growth_points || 0) + currentPoints;
  const progressPercentage = Math.min((totalPoints / 100) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="w-full py-4 px-6 md:px-12 bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">TendATree</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">Hello, {user?.email}</span>
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => navigate("/super-admin")}>
                <Shield className="h-4 w-4" />
                <span className="sr-only">Super Admin</span>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setShowAdminPanel(!showAdminPanel)}>
              <Cog className="h-4 w-4" />
              <span className="sr-only">Admin Settings</span>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-6 md:p-12">
        {tree && tree.tree_species ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* DEBUG: Show treeUpdateKey */}
              <div className="text-xs mb-1 text-gray-500 italic">
                DEBUG: treeUpdateKey is {treeUpdateKey}
              </div>
              {inactivityWarning && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Inactivity Warning</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-700">
                      Your tree has been inactive for {inactivityWarning.hoursInactive} hours. 
                      This may result in a penalty of up to {inactivityWarning.potentialPenalty} points during the next evaluation.
                      Care for your tree to reset the activity timer!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Current Event Display - Pass refreshKey to force updates */}
              <CurrentEvent treeId={tree.id} refreshKey={treeUpdateKey} />

              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-3xl text-green-800 flex items-center justify-between">
                    {tree.tree_species.name}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-600">{totalPoints}/100</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(tree.health || 'healthy')}`}>
                        {tree.health || 'healthy'}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={getTreeImageUrl(tree)} 
                    alt={tree.tree_species.name || 'Your tree'}
                    className="rounded-lg shadow-lg w-full max-h-[500px] object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", e.currentTarget.src);
                      e.currentTarget.src = "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop";
                    }}
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-gray-600 capitalize">Current stage: <span className="font-semibold">{tree.growth_stage}</span></p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Growth Progress</span>
                        <span>{totalPoints}/100 points</span>
                      </div>
                      <Progress value={progressPercentage} className="w-full" />
                      {totalPoints >= 100 && (
                        <p className="text-green-600 text-sm font-medium">Ready to advance! Evaluate your growth to grow your tree.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <TreeGrowthStages 
                currentStage={tree.growth_stage} 
                refreshKey={treeUpdateKey}
              />

              {/* Care Guidance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span>Care Guidance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="font-medium text-blue-700">Water</p>
                      <p className="text-lg font-bold text-blue-600">{getTargetRange('water')}</p>
                      <p className="text-xs text-blue-500">actions for bonus</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <Sun className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                      <p className="font-medium text-yellow-700">Sunlight</p>
                      <p className="text-lg font-bold text-yellow-600">{getTargetRange('sunlight')}</p>
                      <p className="text-xs text-yellow-500">actions for bonus</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <Apple className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <p className="font-medium text-orange-700">Feed</p>
                      <p className="text-lg font-bold text-orange-600">{getTargetRange('feed')}</p>
                      <p className="text-xs text-orange-500">actions for bonus</p>
                    </div>
                    <div className="bg-pink-50 p-3 rounded-lg">
                      <Heart className="h-6 w-6 mx-auto mb-1 text-pink-500" />
                      <p className="font-medium text-pink-700">Love</p>
                      <p className="text-lg font-bold text-pink-600">{getTargetRange('love')}</p>
                      <p className="text-xs text-pink-500">actions for bonus</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Find the perfect number within each range to earn <span className="font-bold text-green-600">25 points</span> per category!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      The optimal number changes after each evaluation. Miss it? You get 1 point per action.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Care Actions Summary with Points */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Your Care Actions (This Round)</CardTitle>
                    <Button 
                      onClick={runEvaluation} 
                      variant="outline" 
                      size="sm"
                      disabled={isEvaluating}
                    >
                      {isEvaluating ? "Evaluating..." : "Evaluate Growth"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="font-medium">Water</p>
                      <p className={`text-2xl font-bold ${isTargetHit('water', careActionCounts.water) ? 'text-green-600' : 'text-blue-600'}`}>
                        {careActionCounts.water}
                      </p>
                      <p className="text-xs text-gray-500">
                        Range: {getTargetRange('water')}
                      </p>
                      <p className="text-xs font-medium text-yellow-600">
                        {isTargetHit('water', careActionCounts.water) ? '25 pts' : `${careActionCounts.water} pts`}
                      </p>
                    </div>
                    <div className="text-center">
                      <Sun className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                      <p className="font-medium">Sunlight</p>
                      <p className={`text-2xl font-bold ${isTargetHit('sunlight', careActionCounts.sunlight) ? 'text-green-600' : 'text-yellow-600'}`}>
                        {careActionCounts.sunlight}
                      </p>
                      <p className="text-xs text-gray-500">
                        Range: {getTargetRange('sunlight')}
                      </p>
                      <p className="text-xs font-medium text-yellow-600">
                        {isTargetHit('sunlight', careActionCounts.sunlight) ? '25 pts' : `${careActionCounts.sunlight} pts`}
                      </p>
                    </div>
                    <div className="text-center">
                      <Apple className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <p className="font-medium">Feed</p>
                      <p className={`text-2xl font-bold ${isTargetHit('feed', careActionCounts.feed) ? 'text-green-600' : 'text-orange-600'}`}>
                        {careActionCounts.feed}
                      </p>
                      <p className="text-xs text-gray-500">
                        Range: {getTargetRange('feed')}
                      </p>
                      <p className="text-xs font-medium text-yellow-600">
                        {isTargetHit('feed', careActionCounts.feed) ? '25 pts' : `${careActionCounts.feed} pts`}
                      </p>
                    </div>
                    <div className="text-center">
                      <Heart className="h-6 w-6 mx-auto mb-1 text-pink-500" />
                      <p className="font-medium">Love</p>
                      <p className={`text-2xl font-bold ${isTargetHit('love', careActionCounts.love) ? 'text-green-600' : 'text-pink-600'}`}>
                        {careActionCounts.love}
                      </p>
                      <p className="text-xs text-gray-500">
                        Range: {getTargetRange('love')}
                      </p>
                      <p className="text-xs font-medium text-yellow-600">
                        {isTargetHit('love', careActionCounts.love) ? '25 pts' : `${careActionCounts.love} pts`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Current Round Points: <span className="font-bold text-green-600">{currentPoints}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Find the exact number within each range to earn 25 points! Need 100 total points to advance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              {/* DEBUG: Show treeUpdateKey */}
              <div className="text-xs mb-1 text-gray-500 italic">
                DEBUG: treeUpdateKey is {treeUpdateKey}
              </div>
              {/* Care Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Care Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCareAction('water')} disabled={isCaring}>
                    <Droplet className="mr-2" /> Water Tree
                  </Button>
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => handleCareAction('sunlight')} disabled={isCaring}>
                    <Sun className="mr-2" /> Provide Sunlight
                  </Button>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleCareAction('feed')} disabled={isCaring}>
                    <Apple className="mr-2" /> Feed Tree
                  </Button>
                  <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white" onClick={() => handleCareAction('love')} disabled={isCaring}>
                    <Heart className="mr-2" /> Talk to Tree
                  </Button>
                </CardContent>
              </Card>

              {/* Tree Event Log - Pass refreshKey to force updates */}
              <TreeEventLog treeId={tree.id} refreshKey={treeUpdateKey} />
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">We're planting your tree. Come back soon to see its progress!</p>
          </div>
        )}

        {showAdminPanel && <AdminPanel />}
      </main>
      
      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        treeName={tree?.tree_species?.name || 'Your Tree'}
        userName={user?.email || 'Tree Tender'}
      />
    </div>
  );
};

export default Dashboard;
