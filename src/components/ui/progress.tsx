import { Indicator, Root } from "@radix-ui/react-progress";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const MAX_PERCENTAGE = 100;

type ProgressProps = ComponentPropsWithoutRef<typeof Root>;

function Progress({ className, value, ...props }: ProgressProps) {
  const offset = MAX_PERCENTAGE - (value ?? 0);

  return (
    <Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      data-slot="progress"
      {...props}
    >
      <Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        data-slot="progress-indicator"
        style={{ transform: `translateX(-${offset}%)` }}
      />
    </Root>
  );
}

export { Progress };
