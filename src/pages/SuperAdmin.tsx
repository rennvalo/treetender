import { useEffect, useState } from "react";
import { api, session } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Leaf, ArrowLeft, Save, Shield, TestTube } from "lucide-react";
import CelebrationModal from "@/components/CelebrationModal";

type SpeciesWithParams = { id: number; name: string; care_parameters: any };

const ADMIN_EMAIL = "renn.co@gmail.com";

const SuperAdmin = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [species, setSpecies] = useState<SpeciesWithParams[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const me = session.getUser();
      if (!me) {
        navigate("/auth");
        return;
      }
      setUserEmail(me.email || null);
      
      // Check if user is authorized admin
      if (me.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        toast.error("Access denied. You are not authorized to view this page.");
        navigate("/dashboard");
        return;
      }
    };

    checkAuth();
    // No realtime auth state in SQLite client yet
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) {
      const fetchSpecies = async () => {
        setLoading(true);
        console.log("Fetching species data...");
        
        // First get all species
  const rows = await fetch('/api/tree_species').then(r=>r.json());
  setSpecies(rows.map((r:any)=> ({ id: r.id, name: r.name, care_parameters: null })));
        setLoading(false);
      };

      fetchSpecies();
    }
  }, [isAuthorized]);

  const handleParameterChange = (speciesId: number, field: string, value: string) => {
    console.log(`Updating ${field} for species ${speciesId} to ${value}`);
    setSpecies(prev => prev.map(s => {
      if (s.id === speciesId && s.care_parameters) {
        const updatedParams = { ...s.care_parameters, [field]: parseInt(value) || 0 };
        return { ...s, care_parameters: updatedParams };
      }
      return s;
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // TODO: implement SQLite admin endpoints to save parameters
      console.log('Save all params placeholder', species);
      toast.success("Parameters save placeholder.");
    } catch (error) {
      console.error("Error saving parameters:", error);
      toast.error("Failed to save parameters");
    } finally {
      setSaving(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      console.log("Running tree evaluation...");
  await fetch('/api/evaluate', { method: 'POST', headers: { 'Authorization': `Bearer ${session.getToken()}` } });
  toast.success("Tree evaluation triggered!");
    } catch (error) {
      console.error("Error running evaluation:", error);
      toast.error("Failed to run evaluation");
    }
  };

  const handleTestCelebration = () => {
    setShowCelebration(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Leaf className="h-12 w-12 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full py-4 px-6 md:px-12 bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800">Super Admin</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleTestCelebration} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Test Celebration
            </Button>
            <Button onClick={handleRunEvaluation} variant="outline">
              Run Evaluation
            </Button>
            <Button onClick={handleSaveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 md:p-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tree Species Care Parameters</h2>
          <p className="text-gray-600">
            Adjust the optimal care ranges for each tree species. Values represent actions needed per 12-hour period.
          </p>
        </div>

        {species.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tree species found in the database.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {species.map((spec) => {
              const params = spec.care_parameters;

              return (
                <Card key={spec.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-800">{spec.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!params ? (
                      <p className="text-red-500">No care parameters set for this species.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`min_water_${spec.id}`} className="text-blue-600">Min Water</Label>
                            <Input
                              id={`min_water_${spec.id}`}
                              type="number"
                              value={params.min_water}
                              onChange={(e) => handleParameterChange(spec.id, 'min_water', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max_water_${spec.id}`} className="text-blue-600">Max Water</Label>
                            <Input
                              id={`max_water_${spec.id}`}
                              type="number"
                              value={params.max_water}
                              onChange={(e) => handleParameterChange(spec.id, 'max_water', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`min_sunlight_${spec.id}`} className="text-yellow-600">Min Sunlight</Label>
                            <Input
                              id={`min_sunlight_${spec.id}`}
                              type="number"
                              value={params.min_sunlight}
                              onChange={(e) => handleParameterChange(spec.id, 'min_sunlight', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max_sunlight_${spec.id}`} className="text-yellow-600">Max Sunlight</Label>
                            <Input
                              id={`max_sunlight_${spec.id}`}
                              type="number"
                              value={params.max_sunlight}
                              onChange={(e) => handleParameterChange(spec.id, 'max_sunlight', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`min_feed_${spec.id}`} className="text-orange-600">Min Feed</Label>
                            <Input
                              id={`min_feed_${spec.id}`}
                              type="number"
                              value={params.min_feed}
                              onChange={(e) => handleParameterChange(spec.id, 'min_feed', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max_feed_${spec.id}`} className="text-orange-600">Max Feed</Label>
                            <Input
                              id={`max_feed_${spec.id}`}
                              type="number"
                              value={params.max_feed}
                              onChange={(e) => handleParameterChange(spec.id, 'max_feed', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`min_love_${spec.id}`} className="text-pink-600">Min Love</Label>
                            <Input
                              id={`min_love_${spec.id}`}
                              type="number"
                              value={params.min_love}
                              onChange={(e) => handleParameterChange(spec.id, 'min_love', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max_love_${spec.id}`} className="text-pink-600">Max Love</Label>
                            <Input
                              id={`max_love_${spec.id}`}
                              type="number"
                              value={params.max_love}
                              onChange={(e) => handleParameterChange(spec.id, 'max_love', e.target.value)}
                              min="0"
                              max="15"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        treeName="Test Oak Tree"
  userName={userEmail || "Tree Caretaker"}
      />
    </div>
  );
};

export default SuperAdmin;
