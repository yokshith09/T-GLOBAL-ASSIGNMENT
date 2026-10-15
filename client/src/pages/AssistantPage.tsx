import { ArrowUp, Bot, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiException,
  type ChatMessage,
  type LeadCreated,
  type PendingConfirmation,
  type ToolEvent,
  getAgentStatus,
  postAgentChat,
  postAgentConfirm,
} from "@/lib/api";
import { formatRupees } from "@/lib/format";

const SUGGESTIONS = [
  "I have 45g of 22K jewellery — how much can I get?",
  "What plans do you offer?",
  "What's the difference between EMI and Bullet?",
];

const TOOL_LABEL: Record<string, string> = {
  get_loan_schemes: "Fetching plans…",
  calculate_quote: "Calculating quote…",
  submit_application: "Preparing your application…",
};

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tools, setTools] = useState<ToolEvent[]>([]);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [submitted, setSubmitted] = useState<LeadCreated | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAgentStatus().then((s) => setConfigured(s.configured)).catch(() => setConfigured(false));
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, submitted, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setPending(null);
    setBusy(true);
    setTools([]);
    try {
      const res = await postAgentChat(next);
      setTools(res.toolEvents);
      if (res.reply) setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      if (res.pendingConfirmation) setPending(res.pendingConfirmation);
    } catch (err) {
      const msg = err instanceof ApiException ? err.error.message : "Something went wrong.";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      const created = await postAgentConfirm(pending.payload);
      setSubmitted(created);
      setPending(null);
    } catch (err) {
      const msg = err instanceof ApiException ? err.error.message : "Couldn't file the application.";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setBusy(false);
    }
  }

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

      {configured === false && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          The assistant isn't configured yet — add an LLM API key (GEMINI_API_KEY) to the server .env.
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(s)}
              className="rounded-full border bg-card px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {messages.map((m, i) => (
          <Bubble key={i} who={m.role === "user" ? "user" : "bot"}>{m.content}</Bubble>
        ))}

        {busy && (
          <div className="flex flex-wrap gap-2">
            {(tools.length ? tools : [{ tool: "thinking", status: "ok" as const }]).map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {TOOL_LABEL[t.tool] ?? "Thinking…"}
              </span>
            ))}
          </div>
        )}

        {pending && !submitted && (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold">Confirm your application</p>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt><dd className="text-right">{pending.payload.name}</dd>
              <dt className="text-muted-foreground">Mobile</dt><dd className="text-right tnum">{maskLocal(pending.payload.mobileNumber)}</dd>
              <dt className="text-muted-foreground">Net / Gross</dt>
              <dd className="text-right tnum">{pending.payload.netWeightGrams} g / {pending.payload.grossWeightGrams} g</dd>
              <dt className="text-muted-foreground">Karat</dt><dd className="text-right">{pending.payload.karat}K</dd>
              <dt className="text-muted-foreground">Eligible loan</dt>
              <dd className="text-right font-display text-lg font-semibold tnum text-primary">{formatRupees(pending.eligibleLoanRupees)}</dd>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={confirm} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & submit"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPending(null)} disabled={busy}>Edit details</Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> We submit only after you confirm.
            </p>
          </div>
        )}

        {submitted && (
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-accent" />
            <p className="font-semibold">Application submitted</p>
            <p className="my-1 font-display text-2xl font-bold tnum text-primary">{submitted.applicationId}</p>
            <p className="text-sm text-muted-foreground">An agent will verify your gold and confirm the final offer.</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-4 mt-6 flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Message Loan Assist…" aria-label="Message" disabled={busy || submitted !== null}
          className="border-0 bg-transparent focus-visible:ring-0" />
        <Button size="icon" type="submit" aria-label="Send" className="shrink-0 rounded-full"
          disabled={busy || submitted !== null}>
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
      <div className={"max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
        (isUser ? "bg-accent text-accent-foreground" : "border bg-card text-foreground")}>
        {children}
      </div>
    </div>
  );
}

function maskLocal(m: string) {
  return m.length === 10 ? `${m.slice(0, 4)}XXXX${m.slice(8)}` : m;
}
