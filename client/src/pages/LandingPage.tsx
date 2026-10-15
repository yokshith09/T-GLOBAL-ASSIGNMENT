import { ArrowRight, Calculator, Coins, FileCheck, Lock, MessageSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { FaqList } from "@/components/FaqList";
import { Button } from "@/components/ui/button";
import { FAQS, PARTNERS, STEPS } from "@/lib/content";

const WHY = [
  { icon: Calculator, title: "Exact, not estimated", body: "Every rupee is computed on our server to the paise — the form and the assistant always agree." },
  { icon: ShieldCheck, title: "Up to 75% LTV", body: "Fair, regulation-aligned loan-to-value, with the cap enforced on every quote." },
  { icon: Zap, title: "Decision in minutes", body: "A live estimate as you type, and an application ID the moment you submit." },
  { icon: Lock, title: "Private by design", body: "Your mobile number is masked everywhere, and nothing is stored until you submit." },
];

export function LandingPage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Preliminary offer in ~2 minutes
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl">
            Turn your gold into a fair loan, the same day.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Enter your jewellery details for an instant, transparent estimate — or just chat with
            our assistant. Up to 75% of your gold's value, with no surprises.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/apply">Get my estimate <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/assistant"><MessageSquare className="h-4 w-4" /> Ask Loan Assist</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Today's 24K rate</p>
          <p className="font-display text-4xl font-semibold tnum text-primary">₹7,000<span className="text-lg text-muted-foreground"> / g</span></p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 text-sm">
            <Fact icon={ShieldCheck} label="Max LTV" value="75%" />
            <Fact icon={Coins} label="Purities" value="18/22/24K" />
            <Fact icon={Calculator} label="Server-checked" value="Every number" />
            <Fact icon={FileCheck} label="Decision" value="Instant" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section>
        <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">Trusted by lending partners</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {PARTNERS.map((p) => (
            <span key={p} className="font-display text-lg font-semibold text-muted-foreground/70">{p}</span>
          ))}
        </div>
      </section>

      {/* Why Aurum */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Why Aurum</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-accent">
                <w.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-medium">{w.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works teaser */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <Link to="/how-it-works" className="text-sm font-medium text-accent underline underline-offset-4">See the full guide</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-semibold text-muted-foreground/30">{i + 1}</span>
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ teaser */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Questions, answered</h2>
          <Link to="/faq" className="text-sm font-medium text-accent underline underline-offset-4">All FAQs</Link>
        </div>
        <div className="mt-6">
          <FaqList items={FAQS.slice(0, 4)} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border bg-accent px-6 py-10 text-center text-accent-foreground">
        <h2 className="font-display text-2xl font-semibold">See what your gold is worth.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-accent-foreground/80">
          No account needed. Your estimate takes about two minutes.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-6">
          <Link to="/apply">Start now <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </section>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-accent" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
