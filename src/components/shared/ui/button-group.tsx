import * as React from "react";

import { cn } from "@/lib/core/utils/utils";

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group"
      className={cn(
        "inline-flex items-center [&>[data-slot=button]:not(:first-child)]:rounded-l-none [&>[data-slot=button]:not(:last-child)]:rounded-r-none",
        className
      )}
      {...props}
    />
  );
}

export { ButtonGroup };


