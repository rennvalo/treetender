
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CareParametersForm } from "./CareParametersForm";
import { Leaf } from "lucide-react";

type SpeciesWithParams = Tables<'tree_species'> & {
  care_parameters: Tables<'care_parameters'>[] | Tables<'care_parameters'> | null;
};

export function AdminPanel() {
  const [species, setSpecies] = useState<SpeciesWithParams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tree_species')
        .select('*, care_parameters(*)');

      if (error) {
        console.error("Error fetching species:", error.message);
      } else if (data) {
        setSpecies(data as SpeciesWithParams[]);
      }
      setLoading(false);
    };

    fetchSpecies();
  }, []);

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
          {species.map((s) => {
            const parameters = Array.isArray(s.care_parameters) ? s.care_parameters[0] : s.care_parameters;
            return (
              <AccordionItem value={s.name} key={s.id}>
                <AccordionTrigger>{s.name}</AccordionTrigger>
                <AccordionContent>
                  {parameters ? (
                    <CareParametersForm parameters={parameters} />
                  ) : (
                    <p className="text-red-500">No care parameters set for this species.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
