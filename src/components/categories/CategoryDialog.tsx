"use client";
import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";


export type Category = {
  id: number;
  name: string;
  color: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const schema = z.object({
  name: z.string().min(1, "Required").max(60, "Too long"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/i, "Hex color e.g. #7c3aed"),
  active: z.boolean(),
});

export type CategoryValues = z.infer<typeof schema>;

export function CategoryDialog({ open, onOpenChange, onSuccess, initial }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initial?: Category;
}) {
  const form = useForm<CategoryValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: initial ?? { name: "",  color: "#6366f1", active: true },
    values: initial ? { name: initial.name, color: initial.color, active: initial.active } : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (values: CategoryValues) => {
      if (initial) {
        return api.put(`/api/categories/${initial.id}`, values);
      }
      return api.post("/api/categories", values);
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);          // ⬅️ zamknij dialog po sukcesie
    },
    onError: () => form.setError("root", { message: "Failed to save. Try again." }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Define a budget category for faster planning and reporting.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Groceries" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="h-9 w-12 p-1" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                        <Input placeholder="#6366f1" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="!m-0">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">Inactive categories stay in history but are hidden from pickers.</p>
                  </div>
                </FormItem>
              )}
            />

            {form.formState.errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{initial ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
