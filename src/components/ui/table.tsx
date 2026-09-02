import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Table primitives. The wrapper scrolls horizontally rather than letting the page
 * scroll sideways; on mobile, screens should switch to cards instead (§31).
 */
export const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<"table">>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

export const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => (
  <tfoot className={cn("border-t bg-muted/40 font-medium", className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr className={cn("border-b transition-colors hover:bg-muted/40", className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    className={cn(
      "h-11 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      className,
    )}
    {...props}
  />
);

export const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td className={cn("px-3 py-3 align-middle", className)} {...props} />
);

export const TableCaption = ({ className, ...props }: React.ComponentProps<"caption">) => (
  <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
);
