import { cn } from "@/lib/utils/cn";

/** The base shimmer. Compose it into page-shaped skeletons (frontend-requirements §22). */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
