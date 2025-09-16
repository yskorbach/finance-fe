"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Grid3X3 } from "lucide-react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { CategoryDialog } from "@/components/categories/CategoryDialog";
import { ConfirmDialog } from "@/components/categories/ConfirmDialog";

import { CardsGrid } from "./CardsGrid";         // <- dopisz w CardsGrid render badge kind przy subach
import { SectionHeader } from "./SectionHeader";
import { CardsSkeleton } from "./CardsSkeleton";
import { SubcategoryDialogInline } from "./SubcategoryDialogInline";

// ==== TYPES ====
// Uwaga: TERAZ brak kind na Category, ZA TO jest na Subcategory.
export type Category = {
  id: number;
  name: string;
  color: string;
  active: boolean;
};

export type CategoryKind = "ESSENTIALS" | "SAVING" | "DISCRETIONARY";

export type Subcategory = {
  id: number;
  categoryId: number;
  name: string;
  active: boolean;
  kind: CategoryKind; // <- przeniesione tutaj
};

export type CategoryWithSubsDto = Category & {
  subcategoryCount: number;
  subcategories: Subcategory[]; // każda ma swój kind
};

// ==== API ====
type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

async function fetchCategories(params: { search: string }) {
  const q = params.search ? `&search=${encodeURIComponent(params.search)}` : "";
  const res = await api.get<Page<Category>>(`/api/categories?page=0&size=500${q}`);
  return res.data?.content ?? [];
}

async function fetchCategoryWithSubs(id: number) {
  const res = await api.get<CategoryWithSubsDto>(`/api/categories/${id}/with-subs`);
  return res.data;
}
async function deleteCategory(id: number) {
  await api.delete(`/api/categories/${id}`);
}
async function deleteSubcategory(categoryId: number, subId: number) {
  await api.delete(`/api/categories/${categoryId}/subcategories/${subId}`);
}

export function CategoriesBoard() {
  const qc = useQueryClient();
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 300);

  const [openNew, setOpenNew] = React.useState(false);
  const [edit, setEdit] = React.useState<Category | null>(null);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);

  const [subEdit, setSubEdit] = React.useState<{ categoryId: number; sub?: Subcategory } | null>(null);
  const [subDelete, setSubDelete] = React.useState<{ categoryId: number; sub: Subcategory } | null>(null);

  // 1) Lista kategorii
  const categoriesQuery = useQuery({
    queryKey: ["categories-board", debounced],
    queryFn: () => fetchCategories({ search: debounced }),
    staleTime: 30_000,
  });

  const categories = categoriesQuery.data ?? [];

  // 2) Równoległe subkategorie (z kind na subie)
  const subsQueries = useQueries({
    queries: categories.map((c) => ({
      queryKey: ["category-with-subs", c.id],
      queryFn: () => fetchCategoryWithSubs(c.id),
      staleTime: 30_000,
    })),
  });

  const withSubsById = new Map<number, CategoryWithSubsDto>();
  subsQueries.forEach((q) => {
    if (q.data) withSubsById.set(q.data.id, q.data);
  });

  const removeCategory = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories-board"] }),
  });
  const removeSub = useMutation({
    mutationFn: ({ categoryId, subId }: { categoryId: number; subId: number }) =>
      deleteSubcategory(categoryId, subId),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["category-with-subs", vars.categoryId] }),
  });

  const invalidateSubs = React.useCallback(
    (categoryId: number) => {
      qc.invalidateQueries({ queryKey: ["category-with-subs", categoryId] });
    },
    [qc]
  );

  const isLoadingAny = categoriesQuery.isLoading;

  return (
    <div className="grid gap-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-[260px]"
          />
        </div>
        <Button onClick={() => setOpenNew(true)} className="inline-flex gap-2">
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {/* Jedna sekcja — wszystkie kategorie; kind widoczny na poziomie SUB */}
      <SectionHeader
        icon={<Grid3X3 className="h-4 w-4" />}
        title="Categories"
        subtitle="Manage categories and subcategories. Kind is defined per subcategory."
      />
      {isLoadingAny ? (
        <CardsSkeleton />
      ) : (
        <CardsGrid
          items={categories}
          withSubsById={withSubsById}
          onEdit={setEdit}
          onDelete={setToDelete}
          onNewSub={(catId) => setSubEdit({ categoryId: catId })}
          onEditSub={(catId, sub) => setSubEdit({ categoryId: catId, sub })}
          onDeleteSub={(catId, sub) => setSubDelete({ categoryId: catId, sub })}
          busy={subsQueries.some((q) => q.isLoading)}
        />
      )}

      <Separator />

      {/* Dialogi kategorii */}
      <CategoryDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["categories-board"] })}
      />
      {edit && (
        <CategoryDialog
          open
          initial={edit}
          onOpenChange={(v) => !v && setEdit(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["categories-board"] })}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete category"
          description={`Delete "${toDelete.name}" and its subcategories?`}
          confirmText="Delete"
          variant="destructive"
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await removeCategory.mutateAsync(toDelete.id);
            setToDelete(null);
          }}
        />
      )}

      {/* Dialogi subkategorii */}
      {subEdit && (
        <SubcategoryDialogInline
          open
          onOpenChange={(v) => !v && setSubEdit(null)}
          categoryId={subEdit.categoryId}
          initial={subEdit.sub}
          onSuccess={() => {
            const cid = subEdit.categoryId;
            setSubEdit(null);
            invalidateSubs(cid);
          }}
        />
      )}
      {subDelete && (
        <ConfirmDialog
          title="Delete subcategory"
          description={`Delete "${subDelete.sub.name}"?`}
          confirmText="Delete"
          variant="destructive"
          onCancel={() => setSubDelete(null)}
          onConfirm={async () => {
            await removeSub.mutateAsync({ categoryId: subDelete.categoryId, subId: subDelete.sub.id });
            setSubDelete(null);
          }}
        />
      )}
    </div>
  );
}
