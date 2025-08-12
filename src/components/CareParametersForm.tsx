import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";

const formSchema = z.object({
  min_water: z.coerce.number().int().min(0),
  max_water: z.coerce.number().int().min(0),
  min_sunlight: z.coerce.number().int().min(0),
  max_sunlight: z.coerce.number().int().min(0),
  min_feed: z.coerce.number().int().min(0),
  max_feed: z.coerce.number().int().min(0),
  min_love: z.coerce.number().int().min(0),
  max_love: z.coerce.number().int().min(0),
});

export type CareParametersFormProps = {
  parameters: any;
  onSave?: (payload: any) => Promise<void>;
};

export function CareParametersForm({
  parameters,
  onSave,
}: CareParametersFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      min_water: parameters.min_water,
      max_water: parameters.max_water,
      min_sunlight: parameters.min_sunlight,
      max_sunlight: parameters.max_sunlight,
      min_feed: parameters.min_feed,
      max_feed: parameters.max_feed,
      min_love: parameters.min_love,
      max_love: parameters.max_love,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      if (onSave) await onSave(values);
      toast.success("Care parameters saved.");
    } catch (e: any) {
      toast.error(e.message || "Failed to save parameters");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="min_water"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Water</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_water"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Water</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="min_sunlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Sunlight</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_sunlight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Sunlight</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="min_feed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Feed</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_feed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Feed</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="min_love"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Love</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_love"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Love</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
