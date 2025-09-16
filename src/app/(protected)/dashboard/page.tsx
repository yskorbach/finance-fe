// app/dashboard/page.tsx
import {DashboardView} from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto grid gap-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Dashboard</h1>
      <DashboardView />
    </main>
  );
}
