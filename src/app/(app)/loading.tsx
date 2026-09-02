import { CardGridSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppSectionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <CardGridSkeleton />
      <TableSkeleton />
    </div>
  );
}
