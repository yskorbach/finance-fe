// app/(app)/categories/page.tsx
"use client";

import { LayoutDashboard } from "lucide-react";
import { CategoriesBoard } from "@/components/categories/CategoriesBoard";
import {PageHeader, PageShell} from "@/components/PageScaffold";

export default function CategoriesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Categories"
        description="Manage your budget categories and subcategories. Changes reflect across your dashboard."
        backHref="/dashboard"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Categories" },
        ]}
        primaryAction={{
          label: "Go to Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        }}
      />
      <CategoriesBoard />
    </PageShell>
  );
}
