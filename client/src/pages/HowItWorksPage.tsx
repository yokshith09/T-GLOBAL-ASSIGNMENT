import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { STEPS } from "@/lib/content";

const NEED = [
  "Your gold jewellery's net and gross weight",
  "The karat (18K, 22K or 24K)",
  "Your name and a 10-digit mobile number",
];

const PLANS = [
  { name: "Monthly EMI", rate: "10.5% p.a.", ltv: "up to 75% LTV", note: "Repaid in equal monthly instalments over 12 months." },
  { name: "Bullet Repayment", rate: "12.0% p.a.", ltv: "up to 70% LTV", note: "Interest and principal settled together at maturity." },
];

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <header>
        <h1 className="font-display text-3xl font-semibold">How it works</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          A transparent, server-checked estimate in three steps — through the form or the assistant.
        </p>
      </header>

      {/* Steps */}
      <ol className="space-y-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-xl border bg-card p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-foreground">
              {i + 1}
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-medium"><s.icon className="h-4 w-4 text-accent" /> {s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* What you need */}
      <section>
        <h2 className="font-display text-2xl font-semibold">What you'll need</h2>
        <ul className="mt-4 space-y-2">
          {NEED.map((n) => (
            <li key={n} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-accent" /> {n}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" /> Your mobile number is masked everywhere, and nothing is stored until you submit.
        </p>
      </section>

      {/* Plans */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Repayment plans</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-xl border bg-card p-5">
              <h3 className="font-medium">{p.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.rate} · {p.ltv}</p>
              <p className="mt-3 text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/apply">Get my estimate <ArrowRight className="h-4 w-4" /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/faq">Read the FAQ</Link></Button>
      </div>
    </div>
  );
}
