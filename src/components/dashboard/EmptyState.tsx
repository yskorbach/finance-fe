import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="grid gap-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No plans yet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">Start by creating your first monthly budget plan.</p>
          <div>
            <Button asChild>
              <Link href="/plans/new">Create plan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
