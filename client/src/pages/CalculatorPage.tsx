import { ArrowRight, Calculator, Coins, Loader2, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tile } from "@/components/Tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Quote, type Scheme, getSchemes, postQuote } from "@/lib/api";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

const KARATS = [18, 22, 24] as const;
const TENURES = [6, 12, 24] as const;

const isBullet = (s: Scheme) => s.name.toLowerCase().includes("bullet");

/** Monthly EMI for a reducing-balance loan. */
function emi(principal: number, annualPct: number, months: number): number {
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  const f = (1 + r) ** months;
  return (principal * r * f) / (f - 1);
}

/**
 * Standalone loan calculator — no name/mobile, no submission. The eligible loan
 * comes from the server; the repayment breakdown is an illustrative client-side
 * estimate (like an EMI / returns calculator).
 */
export function CalculatorPage() {
  const navigate = useNavigate();
  const [gross, setGross] = useState("46");
  const [net, setNet] = useState("45");
  const [karat, setKarat] = useState<number>(22);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null); // chosen loan amount
  const [tenure, setTenure] = useState<number>(12);

  useEffect(() => {
    getSchemes().then((s) => { setSchemes(s); setPlanId((p) => p || s[0]?.id || ""); }).catch(() => setSchemes([]));
  }, []);

  useEffect(() => {
    const n = Number(net), g = Number(gross);
    if (!(n > 0 && g > 0 && n <= g)) {
      setQuote(null);
      setErr(net && gross && n > g ? "Net weight cannot exceed gross weight." : null);
      return;
    }
    setErr(null);
    setLoading(true);
    const t = setTimeout(() => {
      postQuote({ netWeightGrams: n, grossWeightGrams: g, karat })
        .then(setQuote).catch(() => setQuote(null)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [net, gross, karat]);

  const plan = schemes.find((s) => s.id === planId);
  const eligible = quote?.quotes.find((q) => q.schemeId === planId)?.eligibleLoanRupees ?? null;

  // Reset the chosen amount to the full eligible loan whenever it changes.
  useEffect(() => { setAmount(eligible); }, [eligible]);

  const bullet = plan ? isBullet(plan) : false;
  const months = bullet ? (plan?.tenureMonths ?? 12) : tenure;

  const payableFor = (principal: number) => {
    if (!plan) return { emi: null as number | null, interest: 0, total: principal };
    const rate = plan.annualRatePercent;
    if (bullet) {
      const interest = principal * (rate / 100) * (months / 12);
      return { emi: null as number | null, interest, total: principal + interest };
    }
    const m = emi(principal, rate, months);
    const total = m * months;
    return { emi: m, interest: total - principal, total };
  };

  const breakdown = useMemo(() => (amount ? payableFor(amount) : null), [plan, amount, months, bullet]);
  // Total payable at the full eligible loan — the bar's 100% reference, so the bar
  // visibly grows and shrinks as you drag the loan amount.
  const fullTotal = useMemo(() => (eligible ? payableFor(eligible).total : null), [plan, eligible, months, bullet]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gold loan calculator</h1>
          <p className="mt-1 text-muted-foreground">Estimate your eligible loan and repayment instantly, no details needed.</p>
        </div>
        <div className="inline-flex items-center gap-3 self-start rounded-xl border bg-card px-4 py-2.5 sm:self-auto">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
          <div>
            <p className="text-[11px] text-muted-foreground">Today's 24K rate</p>
            <p className="font-display text-lg font-semibold tnum text-gold">₹7,000<span className="text-xs text-muted-foreground"> / g</span></p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Inputs */}
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-gross">Gross weight (g)</Label>
                <Input id="c-gross" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-net">Net weight (g)</Label>
                <Input id="c-net" inputMode="decimal" value={net} aria-invalid={!!err} onChange={(e) => setNet(e.target.value)} />
              </div>
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}

            <div className="space-y-2">
              <Label>Karat</Label>
              <div className="flex gap-2" role="radiogroup" aria-label="Karat">
                {KARATS.map((k) => (
                  <Button key={k} type="button" role="radio" aria-checked={karat === k}
                    variant={karat === k ? "default" : "outline"} className="flex-1" onClick={() => setKarat(k)}>{k}K</Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <div className="flex gap-2" role="radiogroup" aria-label="Plan">
                {schemes.map((s) => (
                  <Button key={s.id} type="button" role="radio" aria-checked={planId === s.id}
                    variant={planId === s.id ? "default" : "outline"} className="flex-1 text-xs sm:text-sm"
                    onClick={() => setPlanId(s.id)}>{s.name}</Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <Tile icon={Scale} label="Pure gold" value={quote ? `${quote.pureGoldGrams} g` : "—"} />
              <Tile icon={Coins} label="Gold value" value={quote ? formatRupees(quote.goldValueRupees) : "—"} />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Eligible loan {plan ? `· ${plan.name}` : ""}</p>
                  <p className="font-display text-3xl font-semibold tnum text-primary">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : eligible === null ? "—" : formatRupees(eligible)}
                  </p>
                </div>
                {plan && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{plan.annualRatePercent}% p.a. · up to {plan.maxLtvPercent}% LTV</span>}
              </div>

              {/* Loan amount slider */}
              {eligible !== null && amount !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label htmlFor="c-amount">Loan amount</Label>
                    <span className="font-medium tnum text-foreground">{formatRupees(amount)}</span>
                  </div>
                  <input id="c-amount" type="range" min={Math.min(1000, eligible)} max={eligible} step={500}
                    value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary" />
                  <p className="text-xs text-muted-foreground">Borrow up to your eligible amount.</p>
                </div>
              )}

              {/* Tenure (EMI only) */}
              {!bullet && (
                <div className="space-y-2">
                  <Label>Tenure</Label>
                  <div className="flex gap-2">
                    {TENURES.map((t) => (
                      <Button key={t} type="button" variant={tenure === t ? "default" : "outline"} size="sm"
                        className="flex-1" onClick={() => setTenure(t)}>{t} mo</Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakdown */}
              {breakdown && amount && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Stat label={bullet ? "At maturity" : "Monthly EMI"} value={formatRupees(Math.round(bullet ? breakdown.total : breakdown.emi ?? 0))} big />
                    <Stat label="Total interest" value={formatRupees(Math.round(breakdown.interest))} />
                    <Stat label="Total payable" value={formatRupees(Math.round(breakdown.total))} />
                  </div>
                  {/* principal vs interest split */}
                  <div className="space-y-2">
                    <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-secondary">
                      <div className="rounded-full bg-accent transition-all duration-300" style={{ width: `${(amount / (fullTotal ?? breakdown.total)) * 100}%` }} />
                      <div className="rounded-full bg-primary transition-all duration-300" style={{ width: `${(breakdown.interest / (fullTotal ?? breakdown.total)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Principal
                        <span className="font-medium text-foreground">{Math.round((amount / breakdown.total) * 100)}%</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium text-foreground">{Math.round((breakdown.interest / breakdown.total) * 100)}%</span>
                        Interest <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Illustrative repayment estimate over {months} months at {plan?.annualRatePercent}% p.a.
                    {bullet ? " Interest and principal are settled together at maturity." : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled={!quote}
            onClick={() => navigate("/apply", { state: { net, gross, karat } })}>
            Apply with these details <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" /> Eligible loan is server-checked. Final loan after in-branch appraisal.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-display font-semibold tnum", big ? "text-lg text-primary" : "text-base")}>{value}</p>
    </div>
  );
}
