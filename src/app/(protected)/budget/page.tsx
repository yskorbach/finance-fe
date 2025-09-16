"use client";

import { LayoutDashboard, FolderTree } from "lucide-react";
import { PageHeader, PageShell } from "@/components/PageScaffold";
import dynamic from "next/dynamic";

// Lazy-load to keep initial page snappy if wizard is heavy
const BudgetPlanWizard = dynamic(() => import("@/components/budget/BudgetPlanWizard"), {
  ssr: false,
});

export default function NewBudgetPage() {
  return (
    <PageShell>
      <PageHeader
        title="New Budget Plan"
        description="Create a monthly budget starting from income, then allocate essentials, savings/debt, and discretionary expenses. Follow the guided steps and save when you're done."
        backHref="/dashboard"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Budget", href: "/budget" },
          { label: "New Plan" },
        ]}
        primaryAction={{
          label: "Go to Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        }}
      />

      {/* Wizard: Income → Essentials → Savings/Debt → Discretionary → Summary */}
      <div className="max-w-6xl mx-auto">
        <BudgetPlanWizard />
      </div>
    </PageShell>
  );
}
