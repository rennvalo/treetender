import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CareParametersForm } from "./CareParametersForm";
import { Leaf } from "lucide-react";

type SpeciesWithParams = {
  id: number;
  name: string;
  description?: string | null;
  care_parameters: any;
};

export function AdminPanel() {
  const [species, setSpecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<Record<number, any>>({});

  useEffect(() => {
    const fetchSpecies = async () => {
      setLoading(true);
      try {
        const rows = await fetch('/api/tree_species').then(r=>r.json());
        setSpecies(rows);
        // fetch params in parallel
        const paramEntries = await Promise.all(rows.map(async (r:any)=> [r.id, await api.getSpeciesParams(r.id)] as const));
        const map: Record<number, any> = {};
        for (const [id, p] of paramEntries) map[id] = p;
        setParams(map);
      } catch (e) {
        console.error('Error fetching species:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  const handleSave = async (id: number, payload: any) => {
    const updated = await api.updateSpeciesParams(id, payload);
    setParams(prev => ({ ...prev, [id]: updated }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Leaf className="h-8 w-8 text-green-600 animate-spin" />
        <p className="ml-2">Loading Admin Settings...</p>
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Admin Settings: Care Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Adjust the ideal care conditions for each tree species. Values represent counts per 12-hour period.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {species.map((s:any) => (
            <AccordionItem value={String(s.id)} key={s.id}>
              <AccordionTrigger>{s.name}</AccordionTrigger>
              <AccordionContent>
                {params[s.id] ? (
                  <CareParametersForm parameters={params[s.id]} onSave={(payload)=>handleSave(s.id, payload)} />
                ) : (
                  <p className="text-gray-600 text-sm">Loading parameters...</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
