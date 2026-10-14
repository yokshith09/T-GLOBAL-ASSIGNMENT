import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = ["Details", "Live quote", "Confirm"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Application progress">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "active" && "border-primary text-primary",
                state === "todo" && "border-border text-muted-foreground",
              )}
              aria-current={state === "active" ? "step" : undefined}
            >
              {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", state === "todo" && "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
