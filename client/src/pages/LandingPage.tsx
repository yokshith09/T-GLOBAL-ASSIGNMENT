import { ArrowRight, BadgeCheck, Calculator, Coins, FileCheck, IdCard, Lock, MessageSquare, Scale, ShieldCheck, Sparkles, Weight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { FaqList } from "@/components/FaqList";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { FAQS, PARTNERS, STEPS } from "@/lib/content";

const WHY = [
  { icon: Calculator, title: "Exact, not estimated", body: "Every rupee is computed on our server to the paise, so the form and the assistant always agree." },
  { icon: ShieldCheck, title: "Up to 75% LTV", body: "Fair, regulation-aligned loan-to-value, with the cap enforced on every quote." },
  { icon: Zap, title: "Decision in minutes", body: "A live estimate as you type, and an application ID the moment you submit." },
  { icon: Lock, title: "Private by design", body: "Your mobile number is masked everywhere, and nothing is stored until you submit." },
];

const NEED = [
  { icon: Weight, title: "Weights", body: "Net and gross weight of your jewellery, in grams." },
  { icon: Scale, title: "Purity", body: "The karat: 18K, 22K or 24K." },
  { icon: IdCard, title: "Contact", body: "Your name and a 10-digit mobile number." },
];

const PLANS = [
  { name: "Monthly EMI", rate: "10.5% p.a.", ltv: "75%", note: "Repaid in equal monthly instalments over 12 months.", best: true },
  { name: "Bullet Repayment", rate: "12.0% p.a.", ltv: "70%", note: "Interest and principal settled together at maturity.", best: false },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <a href="#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#faq" className="text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to="/apply">Get estimate <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-glow">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <div>
              <span className="anim-fade-up inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground" style={{ animationDelay: "40ms" }}>
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Preliminary offer in ~2 minutes
              </span>
              <h1 className="anim-fade-up mt-4 font-display text-4xl font-semibold leading-[1.03] sm:text-5xl lg:text-6xl" style={{ animationDelay: "120ms" }}>
                Turn your gold into a <span className="text-gold">fair loan</span>, the same day.
              </h1>
              <p className="anim-fade-up mt-5 max-w-prose text-lg text-muted-foreground" style={{ animationDelay: "200ms" }}>
                Enter your jewellery details for an instant, transparent estimate, or just chat with
                our assistant. Up to 75% of your gold's value, with no surprises.
              </p>
              <div className="anim-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "280ms" }}>
                <Button asChild size="lg">
                  <Link to="/apply">Get my estimate <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/calculator"><Calculator className="h-4 w-4" /> Try the calculator</Link>
                </Button>
              </div>
            </div>

            {/* anim-fade-up handles the entrance (opacity); the inner wrapper floats
                — keeping the two animations on separate elements so neither overrides the other. */}
            <div className="anim-fade-up" style={{ animationDelay: "240ms" }}>
              <div className="anim-float space-y-4">
                <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-primary/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Today's 24K rate</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                    </span>
                  </div>
                  <p className="font-display text-5xl font-semibold tnum text-gold">₹7,000<span className="text-lg text-muted-foreground"> / g</span></p>
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 text-sm">
                    <Fact icon={ShieldCheck} label="Max LTV" value="75%" />
                    <Fact icon={Coins} label="Purities" value="18/22/24K" />
                    <Fact icon={Calculator} label="Server-checked" value="Every number" />
                    <Fact icon={FileCheck} label="Decision" value="Instant" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1"><Lock className="h-3.5 w-3.5 text-accent" /> Mobile masked</span>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> No account needed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-24 px-4 pb-24">
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
            <h2 className="font-display text-3xl font-semibold">Why Aurum</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {WHY.map((w) => (
                <div key={w.title} className="flex gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
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

          {/* How it works */}
          <section id="how-it-works" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-semibold">How it works</h2>
            <p className="mt-2 max-w-prose text-muted-foreground">
              A transparent, server-checked estimate in three steps, through the form or the assistant.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative overflow-hidden rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-3xl font-bold text-gold">{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-medium">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {/* What you'll need */}
              <div className="flex flex-col rounded-2xl border bg-card p-6">
                <h3 className="font-display text-xl font-semibold">What you'll need</h3>
                <ul className="mt-4 flex-1 space-y-3">
                  {NEED.map((n) => (
                    <li key={n.title} className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
                        <n.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  No account needed, and nothing is stored until you submit. The whole thing takes about two minutes.
                </div>
              </div>

              {/* Repayment plans */}
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-display text-xl font-semibold">Repayment plans</h3>
                <div className="mt-4 space-y-3">
                  {PLANS.map((p) => (
                    <div key={p.name} className={"rounded-xl border p-4 " + (p.best ? "border-primary/40 bg-primary/5" : "")}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{p.name}</p>
                        {p.best && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            <BadgeCheck className="h-3.5 w-3.5" /> Highest LTV
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-muted-foreground">{p.rate}</span>
                        <span className="font-medium text-accent">up to {p.ltv} LTV</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-semibold">Questions, answered</h2>
            <div className="mt-6">
              <FaqList items={FAQS} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Still unsure? Open the form and tap{" "}
              <Link to="/apply" className="font-medium text-accent underline underline-offset-4">Loan Assist</Link>
              . It answers and can start your application.
            </p>
          </section>

          {/* Final CTA */}
          <section className="overflow-hidden rounded-2xl border bg-accent px-6 py-12 text-center text-accent-foreground">
            <h2 className="font-display text-3xl font-semibold">See what your gold is worth.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-accent-foreground/80">
              No account needed. Your estimate takes about two minutes.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/apply">Start now <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-accent-foreground/30 bg-transparent text-accent-foreground hover:bg-accent-foreground/10 hover:text-accent-foreground">
                <Link to="/calculator"><Calculator className="h-4 w-4" /> Open calculator</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
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
