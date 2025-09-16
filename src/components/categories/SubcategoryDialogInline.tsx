"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CategoryKind = "ESSENTIALS" | "SAVING" | "DISCRETIONARY";

export type Subcategory = {
  id: number;
  categoryId: number;
  name: string;
  active: boolean;
  kind: CategoryKind;
};

const schema = z.object({
  name: z.string().min(1, "Required").max(60, "Too long"),
  active: z.boolean(),
  kind: z.enum(["ESSENTIALS", "SAVING", "DISCRETIONARY"]),
});
type SubcategoryValues = z.infer<typeof schema>;

export function SubcategoryDialogInline({
                                          open,
                                          onOpenChange,
                                          categoryId,
                                          onSuccess,
                                          initial,
                                        }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  onSuccess: () => void;
  initial?: Subcategory;
}) {
  const form = useForm<SubcategoryValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      active: true,
      kind: "ESSENTIALS",
    },
  });

  // Resetuj wartości gdy zmienia się `initial`
  React.useEffect(() => {
    if (initial) {
      form.reset({
        name: initial.name,
        active: initial.active,
        kind: initial.kind,
      });
    } else {
      form.reset({
        name: "",
        active: true,
        kind: "ESSENTIALS",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, open]);

  const mutation = useMutation({
    mutationFn: async (values: SubcategoryValues) => {
      if (initial) {
        return api.put(`/api/categories/${categoryId}/subcategories/${initial.id}`, values);
      }
      return api.post(`/api/categories/${categoryId}/subcategories`, values);
    },
    onSuccess: () => onSuccess(),
    onError: () => form.setError("root", { message: "Failed to save. Try again." }),
  });

  const title = initial ? "Edit subcategory" : "New subcategory";
  const description = initial
    ? "Update details of the subcategory."
    : "Add a subcategory to better organize your budget.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grid gap-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries / Fuel / Streaming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kind */}
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ESSENTIALS">Essentials</SelectItem>
                      <SelectItem value="SAVING">Saving</SelectItem>
                      <SelectItem value="DISCRETIONARY">Discretionary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="!m-0">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive subcategories are hidden in pickers but kept in history.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Error root */}
            {form.formState.errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {initial ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
