import type { InputHTMLAttributes } from "react";
import { CheckCircle2, Coins, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Tile } from "@/components/Tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupees } from "@/lib/format";
import { MOCK_PLANS, MOCK_QUOTE } from "@/lib/mock";

const KARATS = [18, 22, 24] as const;

export function ApplyPage() {
  const [step, setStep] = useState(0);
  const [karat, setKarat] = useState<number>(22);
  const [selectedPlan, setSelectedPlan] = useState<string>(MOCK_PLANS[0].id);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      {/* Main column: wizard */}
      <div className="order-2 lg:order-1">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            A preliminary gold-loan offer in minutes.
          </h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Enter your jewellery details for a live estimate, or{" "}
            <Link to="/assistant" className="font-medium text-accent underline underline-offset-4">
              chat with Loan Assist
            </Link>
            . The same numbers either way.
          </p>
        </header>

        {submitted ? (
          <SuccessCard onReset={() => { setSubmitted(false); setStep(0); }} />
        ) : (
          <div className="space-y-6">
            <Stepper current={step} />

            {step === 0 && (
              <Card>
                <CardContent className="space-y-5 pt-6">
                  <Field id="name" label="Full name" placeholder="Asha Rao" inputMode="text" />
                  <Field id="mobile" label="Mobile number" placeholder="9876543210" inputMode="numeric" maxLength={10} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="gross" label="Gross weight (g)" placeholder="46" inputMode="decimal" />
                    <Field id="net" label="Net weight (g)" placeholder="45" inputMode="decimal" />
                  </div>
                  <div className="space-y-2">
                    <Label>Karat</Label>
                    <div className="flex gap-2" role="radiogroup" aria-label="Karat">
                      {KARATS.map((k) => (
                        <Button
                          key={k}
                          type="button"
                          role="radio"
                          aria-checked={karat === k}
                          variant={karat === k ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setKarat(k)}
                        >
                          {k}K
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => setStep(1)}>See my quote</Button>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <Tile icon={Scale} label="Pure gold" value={`${MOCK_QUOTE.pureGoldGrams} g`} />
                  <Tile icon={Coins} label="Gold value" value={formatRupees(MOCK_QUOTE.goldValueRupees)} />
                </div>
                <div className="space-y-3" role="radiogroup" aria-label="Loan plan">
                  <p className="text-sm font-medium text-muted-foreground">Choose a repayment plan</p>
                  {MOCK_PLANS.map((p) => {
                    const active = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedPlan(p.id)}
                        className={
                          "flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-all " +
                          (active ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground/30")
                        }
                      >
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {p.annualRatePercent}% p.a. · up to {p.maxLtvPercent}% LTV · {p.tenureNote}
                          </p>
                        </div>
                        <p className="font-display text-xl font-semibold tnum text-primary">
                          {formatRupees(MOCK_QUOTE.byPlan[p.id])}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(2)}>Continue</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="space-y-5 pt-6">
                  <h2 className="font-display text-xl font-semibold">Review &amp; submit</h2>
                  <dl className="divide-y text-sm">
                    <Row label="Name" value="Asha Rao" />
                    <Row label="Mobile" value="9876XXXX10" />
                    <Row label="Net / Gross" value="45 g / 46 g" />
                    <Row label="Karat" value={`${karat}K`} />
                    <Row label="Plan" value={MOCK_PLANS.find((p) => p.id === selectedPlan)?.name ?? ""} />
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-muted-foreground">Eligible loan</dt>
                      <dd className="font-display text-2xl font-semibold tnum text-primary">
                        {formatRupees(MOCK_QUOTE.byPlan[selectedPlan])}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1" size="lg" onClick={() => setSubmitted(true)}>Submit application</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Trust rail */}
      <aside className="order-1 space-y-3 lg:order-2">
        <Tile icon={Coins} label="Today's 24K rate" value="₹7,000 / g" hint="Mock rate for this demo" />
        <Tile icon={ShieldCheck} label="Max loan-to-value" value="75%" hint="Capped by RBI norms" />
        <Tile icon={Sparkles} label="Decision" value="~2 min" hint="Preliminary, before appraisal" />
        <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          Your mobile number is masked everywhere it's shown and in our logs. No details are stored until you submit.
        </div>
      </aside>
    </div>
  );
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-primary" />
      <CardContent className="pt-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h2 className="font-display text-xl font-semibold">Application submitted</h2>
        <p className="mt-1 text-sm text-muted-foreground">Keep this reference handy</p>
        <p className="my-3 font-display text-3xl font-bold tracking-wide tnum text-primary">GL-1042</p>
        <p className="text-sm text-muted-foreground">An agent will verify your gold and confirm the final offer.</p>
        <Button className="mt-6 w-full" size="lg" onClick={onReset}>Start a new application</Button>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Field({ id, label, ...rest }: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...rest} />
    </div>
  );
}
