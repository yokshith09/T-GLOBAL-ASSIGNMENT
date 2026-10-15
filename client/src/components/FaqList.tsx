import { Plus } from "lucide-react";
import type { Faq } from "@/lib/content";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {items.map((f) => (
        <details key={f.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
          </summary>
          <p className="pb-4 text-sm text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
