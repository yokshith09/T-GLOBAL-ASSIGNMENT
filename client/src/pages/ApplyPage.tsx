import { CheckCircle2, Coins, Loader2, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Tile } from "@/components/Tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiException,
  type LeadCreated,
  type Quote,
  type Scheme,
  getSchemes,
  postLead,
  postQuote,
} from "@/lib/api";
import { formatRupees } from "@/lib/format";
import { type FieldErrors, type FormValues, hasErrors, validateDetails } from "@/lib/validation";

const KARATS = [18, 22, 24] as const;
const EMPTY: FormValues = { name: "", mobile: "", gross: "", net: "", karat: 22 };

export function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<LeadCreated | null>(null);
  const [duplicate, setDuplicate] = useState<{ applicationId?: string; appliedAt?: string } | null>(null);

  // Load plans once.
  useEffect(() => {
    getSchemes()
      .then((s) => {
        setSchemes(s);
        setSelectedPlan((prev) => prev || s[0]?.id || "");
      })
      .catch(() => setSchemes([]));
  }, []);

  // Live quote on step 2, debounced 300ms.
  useEffect(() => {
    if (step !== 1) return;
    const net = Number(form.net);
    const gross = Number(form.gross);
    if (!(net > 0 && gross > 0 && net <= gross)) return;
    setQuoting(true);
    const t = setTimeout(() => {
      postQuote({ netWeightGrams: net, grossWeightGrams: gross, karat: form.karat })
        .then(setQuote)
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false));
    }, 300);
    return () => clearTimeout(t);
  }, [step, form.net, form.gross, form.karat]);

  const set = (key: keyof FormValues, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const goToQuote = () => {
    const e = validateDetails(form);
    setErrors(e);
    if (!hasErrors(e)) setStep(1);
  };

  const submit = async () => {
    setSubmitting(true);
    setDuplicate(null);
    try {
      const created = await postLead({
        name: form.name.trim(),
        mobileNumber: form.mobile,
        netWeightGrams: Number(form.net),
        grossWeightGrams: Number(form.gross),
        karat: form.karat,
        schemeId: selectedPlan,
      });
      setSuccess(created);
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setDuplicate({ applicationId: err.error.applicationId, appliedAt: err.error.appliedAt });
      } else if (err instanceof ApiException && err.status === 400) {
        setErrors(mapFields(err));
        setStep(0);
      } else {
        setDuplicate({}); // generic failure banner on confirm
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setQuote(null);
    setSuccess(null);
    setDuplicate(null);
    setStep(0);
  };

  const loanFor = (schemeId: string) =>
    quote?.quotes.find((q) => q.schemeId === schemeId)?.eligibleLoanRupees ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
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

        {success ? (
          <SuccessCard created={success} onReset={reset} planName={schemeName(schemes, selectedPlan)} />
        ) : (
          <div className="space-y-6">
            <Stepper current={step} />

            {step === 0 && (
              <Card>
                <CardContent className="space-y-5 pt-6">
                  <Field id="name" label="Full name" placeholder="Asha Rao" value={form.name}
                    error={errors.name} onChange={(v) => set("name", v)} />
                  <Field id="mobile" label="Mobile number" placeholder="9876543210" inputMode="numeric"
                    maxLength={10} value={form.mobile} error={errors.mobile}
                    onChange={(v) => set("mobile", v.replace(/\D/g, ""))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field id="gross" label="Gross weight (g)" placeholder="46" inputMode="decimal"
                      value={form.gross} error={errors.gross} onChange={(v) => set("gross", v)} />
                    <Field id="net" label="Net weight (g)" placeholder="45" inputMode="decimal"
                      value={form.net} error={errors.net} onChange={(v) => set("net", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Karat</Label>
                    <div className="flex gap-2" role="radiogroup" aria-label="Karat">
                      {KARATS.map((k) => (
                        <Button key={k} type="button" role="radio" aria-checked={form.karat === k}
                          variant={form.karat === k ? "default" : "outline"} className="flex-1"
                          onClick={() => set("karat", k)}>
                          {k}K
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={goToQuote}>See my quote</Button>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <Tile icon={Scale} label="Pure gold"
                    value={quote ? `${quote.pureGoldGrams} g` : "—"} />
                  <Tile icon={Coins} label="Gold value"
                    value={quote ? formatRupees(quote.goldValueRupees) : "—"} />
                </div>
                <div className="space-y-3" role="radiogroup" aria-label="Loan plan">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    Choose a repayment plan
                    {quoting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  </p>
                  {schemes.map((p) => {
                    const active = selectedPlan === p.id;
                    const loan = loanFor(p.id);
                    return (
                      <button key={p.id} type="button" role="radio" aria-checked={active}
                        onClick={() => setSelectedPlan(p.id)}
                        className={"flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-all " +
                          (active ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground/30")}>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {p.annualRatePercent}% p.a. · up to {p.maxLtvPercent}% LTV · {p.tenureNote}
                          </p>
                        </div>
                        <p className="font-display text-xl font-semibold tnum text-primary">
                          {loan === null ? "—" : formatRupees(loan)}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(2)} disabled={!quote}>Continue</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <Card>
                <CardContent className="space-y-5 pt-6">
                  <h2 className="font-display text-xl font-semibold">Review &amp; submit</h2>
                  {duplicate && <DuplicateBanner info={duplicate} />}
                  <dl className="divide-y text-sm">
                    <Row label="Name" value={form.name.trim()} />
                    <Row label="Mobile" value={maskLocal(form.mobile)} />
                    <Row label="Net / Gross" value={`${form.net} g / ${form.gross} g`} />
                    <Row label="Karat" value={`${form.karat}K`} />
                    <Row label="Plan" value={schemeName(schemes, selectedPlan)} />
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-muted-foreground">Eligible loan</dt>
                      <dd className="font-display text-2xl font-semibold tnum text-primary">
                        {loanFor(selectedPlan) === null ? "—" : formatRupees(loanFor(selectedPlan)!)}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={submitting}>Back</Button>
                    <Button className="flex-1" size="lg" onClick={submit} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

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

function DuplicateBanner({ info }: { info: { applicationId?: string; appliedAt?: string } }) {
  if (!info.applicationId) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        Something went wrong submitting your application. Please try again.
      </div>
    );
  }
  const when = info.appliedAt
    ? new Date(info.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "recently";
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      You already applied on {when}, application <strong>{info.applicationId}</strong>.
    </div>
  );
}

function SuccessCard({ created, planName, onReset }: { created: LeadCreated; planName: string; onReset: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-primary" />
      <CardContent className="pt-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h2 className="font-display text-xl font-semibold">Application submitted</h2>
        <p className="mt-1 text-sm text-muted-foreground">{planName} · {formatRupees(created.eligibleLoanRupees)}</p>
        <p className="my-3 font-display text-3xl font-bold tracking-wide tnum text-primary">{created.applicationId}</p>
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

function Field({ id, label, error, value, onChange, ...rest }: {
  id: string;
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)} {...rest} />
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function schemeName(schemes: Scheme[], id: string) {
  return schemes.find((s) => s.id === id)?.name ?? id;
}
function maskLocal(m: string) {
  return m.length === 10 ? `${m.slice(0, 4)}XXXX${m.slice(8)}` : m;
}
function mapFields(err: ApiException): FieldErrors {
  const e: FieldErrors = {};
  for (const f of err.error.fields) {
    if (f.field === "netWeightGrams") e.net = f.message;
    else if (f.field === "grossWeightGrams") e.gross = f.message;
    else if (f.field === "mobileNumber") e.mobile = f.message;
    else if (f.field === "name") e.name = f.message;
  }
  return e;
}
