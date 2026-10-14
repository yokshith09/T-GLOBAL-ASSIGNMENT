import { ArrowUp, Bot, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupees } from "@/lib/format";

const SUGGESTIONS = [
  "I have 45g of 22K jewellery — how much can I get?",
  "What plans do you offer?",
  "What's the difference between EMI and Bullet?",
];

/** Dedicated full-page chat. Wired to POST /agent/chat in Part B. */
export function AssistantPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold">Loan Assist</h1>
          <p className="text-sm text-muted-foreground">
            Ask in plain words. Every figure is calculated by our backend, never guessed.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border bg-card px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Bubble who="user">I have 45 grams of 22 carat jewellery, how much can I get?</Bubble>
        <Bubble who="bot">
          Happy to help. What's the <strong>gross</strong> weight (jewellery with stones), and your name and
          mobile number?
        </Bubble>

        <div className="flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Calculating quote…
          </span>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold">Confirm your application</p>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Net / Gross</dt>
            <dd className="text-right tnum">45 g / 46 g</dd>
            <dt className="text-muted-foreground">Karat</dt>
            <dd className="text-right">22K</dd>
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-right">Monthly EMI · 10.5% p.a.</dd>
            <dt className="text-muted-foreground">Eligible loan</dt>
            <dd className="text-right font-display text-lg font-semibold tnum text-primary">
              {formatRupees(216562)}
            </dd>
          </dl>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1">Confirm &amp; submit</Button>
            <Button variant="outline" className="flex-1">Edit details</Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" /> We submit only after you confirm.
          </p>
        </div>
      </div>

      <form
        className="sticky bottom-4 mt-6 flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          placeholder="Message Loan Assist…"
          aria-label="Message"
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        <Button size="icon" type="submit" aria-label="Send" className="shrink-0 rounded-full">
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ who, children }: { who: "user" | "bot"; children: ReactNode }) {
  const isUser = who === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex items-start gap-2.5"}>
      {!isUser && (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div
        className={
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
          (isUser ? "bg-accent text-accent-foreground" : "border bg-card text-foreground")
        }
      >
        {children}
      </div>
    </div>
  );
}
