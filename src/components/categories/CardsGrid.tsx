import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, ChevronRight, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

import type { Category, CategoryWithSubsDto, Subcategory } from "./CategoriesBoard";
import {EmptySubcategories, SubcategoriesList} from "@/components/categories/SubcategoriesList";

type Props = {
  items: Category[];
  withSubsById: Map<number, CategoryWithSubsDto>;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onNewSub: (categoryId: number) => void;
  onEditSub: (categoryId: number, sub: Subcategory) => void;
  onDeleteSub: (categoryId: number, sub: Subcategory) => void;
  busy?: boolean;
};

export function CardsGrid({
                            items,
                            withSubsById,
                            onEdit,
                            onDelete,
                            onNewSub,
                            onEditSub,
                            onDeleteSub,
                            busy,
                          }: Props) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No categories.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => {
        const full = withSubsById.get(c.id);
        const subs = full?.subcategories ?? [];
        const count = typeof full?.subcategoryCount === "number" ? full.subcategoryCount : undefined;

        return (
          <Card key={c.id} className={cn("relative overflow-hidden", !c.active && "opacity-80")}>
            <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: c.color }} />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 truncate">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                    {!c.active && <Badge variant="secondary">inactive</Badge>}
                  </CardTitle>

                </div>

                <div className="inline-flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit category ${c.name}`}
                    title="Edit"
                    onClick={() => onEdit(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete category ${c.name}`}
                    title="Delete"
                    onClick={() => onDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="mb-2 flex items-center justify-between">
                {/* Lista podkategorii */}
                {subs.length ? (
                  <SubcategoriesList
                    subs={subs}
                    onEdit={(s) => onEditSub(c.id, s)}
                    onDelete={(s) => onDeleteSub(c.id, s)}
                  />
                ) : (
                  <EmptySubcategories />
                )}
              </div>


              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {count !== undefined ? (
                    <>
                      {count} {count === 1 ? "subcategory" : "subcategories"}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => onNewSub(c.id)}
                  aria-label={`Add subcategory to ${c.name}`}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

