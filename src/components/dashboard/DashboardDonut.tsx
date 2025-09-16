"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Label } from "recharts";

export function DashboardDonut({ planned, spent }: { planned: number; spent: number }) {
  const done = Math.min(spent, planned);
  const remaining = Math.max(planned - spent, 0);
  const over = Math.max(spent - planned, 0);

  const data = [
    { name: "Spent", value: done },
    { name: "Remaining", value: remaining },
    { name: "Over", value: over },
  ];

  const colors = [
    "hsl(var(--primary, 240 5.9% 10%))",
    "hsl(var(--muted, 240 4.8% 95.9%))",
    "hsl(var(--destructive, 0 84.2% 60.2%))",
  ];

  const percent = planned > 0 ? Math.min(100, Math.max(0, Math.round((spent / planned) * 100))) : 0;

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
            <Label
              position="center"
              content={() => (
                <div className="text-center">
                  <div className="text-2xl font-semibold">{percent}%</div>
                  <div className="text-xs text-muted-foreground">completion</div>
                </div>
              )}
            />
          </Pie>
          <Tooltip formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), String(name)]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
function formatCurrency(v: number) {
  try {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${v}`;
  }
}
