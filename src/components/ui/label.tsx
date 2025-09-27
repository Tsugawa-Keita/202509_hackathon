import { Root } from "@radix-ui/react-label";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type LabelProps = ComponentPropsWithoutRef<typeof Root>;

function Label({ className, ...props }: LabelProps) {
  return (
    <Root
      className={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
