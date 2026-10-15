import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { FaqList } from "@/components/FaqList";
import { Button } from "@/components/ui/button";
import { FAQS } from "@/lib/content";

export function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Questions, answered</h1>
        <p className="mt-2 text-muted-foreground">
          Everything about eligibility, valuation and how your data is handled.
        </p>
      </header>

      <FaqList items={FAQS} />

      <div className="rounded-xl border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">Didn't find your answer?</p>
        <Button asChild className="mt-3">
          <Link to="/assistant"><MessageSquare className="h-4 w-4" /> Ask Loan Assist</Link>
        </Button>
      </div>
    </div>
  );
}
