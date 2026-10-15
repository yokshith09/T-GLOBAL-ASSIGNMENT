import { Bot } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";

/** Full-page Loan Assist chat at /dashboard/assistant, for a dedicated conversation. */
export function AssistantPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b bg-accent px-4 py-3 text-accent-foreground">
        <Bot className="h-5 w-5" />
        <div>
          <p className="font-display font-semibold leading-tight">Loan Assist</p>
          <p className="text-xs text-accent-foreground/80">Ask in plain words, every figure comes from our backend.</p>
        </div>
      </div>
      <AssistantChat />
    </div>
  );
}
