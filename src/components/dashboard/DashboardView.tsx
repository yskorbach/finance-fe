"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDonut } from "@/components/dashboard/DashboardDonut";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export type DashboardApi = {
  totalPlans: number;
  plansLast12Months: number;
  currentMonth: { planned: number; spent: number } | null;
};

export function DashboardView() {
  // const { data, isLoading, isError } = useQuery({
  //   queryKey: ["dashboard-summary"],
  //   queryFn: async () => (await api.get<DashboardApi>("/api/dashboard")).data!,
  //   staleTime: 60_000,
  // });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardApi> => {
      // 🧪 MOCK na razie
      return Promise.resolve({
        totalPlans: 3,
        plansLast12Months: 2,
        currentMonth: {
          planned: 4200,
          spent: 2875,
        },
      });
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load data. Please refresh.</p>
        </CardContent>
      </Card>
    );
  }

  if (data.totalPlans === 0) return <EmptyState />;

  const planned = data.currentMonth?.planned ?? 0;
  const spent = data.currentMonth?.spent ?? 0;

  return (
    <div className="grid gap-6">
      <DashboardKpis totalPlans={data.totalPlans} last12={data.plansLast12Months} />

      <Card>
        <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
          <CardTitle>Current month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <DashboardDonut planned={planned} spent={spent} />
            <div className="text-sm grid gap-3">
              <Row label="Planned" value={formatCurrency(planned)} />
              <Row label="Spent" value={formatCurrency(spent)} />
              <Row label="Completion" value={`${percent(spent, planned)}%`} />
              <div className="pt-2">
                <QuickLinks />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function percent(spent: number, planned: number) {
  if (!planned) return 0;
  const p = Math.min(100, Math.max(0, (spent / planned) * 100));
  return Math.round(p);
}
function formatCurrency(v: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v);
}
