import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="grid gap-2">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
