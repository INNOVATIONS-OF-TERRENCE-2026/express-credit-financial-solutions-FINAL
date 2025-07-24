import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 bg-white/20" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full bg-white/10" />
      </CardContent>
    </Card>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}