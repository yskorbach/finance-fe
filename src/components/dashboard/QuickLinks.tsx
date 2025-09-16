import Link from "next/link";
import { Button } from "@/components/ui/button";

export function QuickLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm"><Link href="/plans/new">Plan budget</Link></Button>
      <Button asChild size="sm" variant="secondary"><Link href="/plans">Browse plans</Link></Button>
      <Button asChild size="sm" variant="outline"><Link href="/categories">Edit categories</Link></Button>
    </div>
  );
}
