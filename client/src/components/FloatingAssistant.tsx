import { Bot, X } from "lucide-react";
import { useState } from "react";
import { AssistantChat } from "@/components/AssistantChat";

/** Floating Loan Assist launcher, fixed bottom-right across the dashboard. */
export function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Panel */}
      <div
        className={
          "fixed bottom-24 right-4 z-50 flex h-[32rem] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all sm:right-6 " +
          (open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")
        }
        role="dialog"
        aria-label="Loan Assist chat"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b bg-accent px-4 py-3 text-accent-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-display font-semibold">Loan Assist</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="opacity-80 hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {open && <AssistantChat />}
      </div>

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close Loan Assist" : "Open Loan Assist"}
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-lg transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask Loan Assist"}</span>
      </button>
    </>
  );
}
