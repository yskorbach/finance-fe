"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Subcategory } from "./CategoriesBoard";

type Props = {
  subs: Subcategory[];
  onEdit: (s: Subcategory) => void;
  onDelete: (s: Subcategory) => void;
  pageSize?: number;
};

export function SubcategoriesList({ subs, onEdit, onDelete, pageSize = 4 }: Props) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [subs]);

  const total = subs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const visible = React.useMemo(
    () => subs.slice(start, start + pageSize),
    [subs, start, pageSize]
  );

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="rounded-md border bg-background/60 p-2">
      <ul className="space-y-1.5">
        {visible.map((s) => (
          <li
            key={s.id}
            className="group flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/60 focus-within:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-full shrink-0 bg-foreground/40",
                  !s.active && "bg-muted-foreground/40"
                )}
              />
              <span
                className={cn(
                  "text-sm truncate",
                  !s.active && "line-through text-muted-foreground"
                )}
                title={s.name}
              >
                {s.name}
              </span>
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs bg-muted">
                 {s.kind}
              </span>
              {!s.active && (
                <Badge variant="outline" className="h-5 text-xs px-1.5">
                  off
                </Badge>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity inline-flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={`Edit subcategory ${s.name}`}
                onClick={() => onEdit(s)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={`Delete subcategory ${s.name}`}
                onClick={() => onDelete(s)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between px-1">
          {/*<span className="text-xs text-muted-foreground">*/}
          {/*  {start + 1}–{Math.min(start + pageSize, total)} z {total}*/}
          {/*</span>*/}
          <div className="inline-flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={prev}
              disabled={page === 1}
            >
              Prev
            </Button>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={next}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptySubcategories() {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <span aria-hidden className="mt-1 h-2 w-2 rounded-full bg-foreground/30" />
        <div className="grid gap-1">
          <span>Brak podkategorii.</span>
          <span className="text-xs">Dodaj pierwszą, aby zacząć porządkować budżet.</span>
        </div>
      </div>
    </div>
  );
}
