import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, LayoutGrid, TrendingUp } from "lucide-react";

export function DashboardKpis({ totalPlans, last12 }: { totalPlans: number; last12: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KpiCard title="Total plans" value={totalPlans.toString()} icon={<CalendarCheck className="h-5 w-5" aria-hidden />} />
      <KpiCard title="Last 12 months" value={last12.toString()} icon={<TrendingUp className="h-5 w-5" aria-hidden />} />
      <KpiCard title="Actions" value="Shortcuts" icon={<LayoutGrid className="h-5 w-5" aria-hidden />} />
    </div>
  );
}

function KpiCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
