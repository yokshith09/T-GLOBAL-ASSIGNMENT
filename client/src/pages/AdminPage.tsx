import { CheckCircle2, Clock, FileText, IndianRupee, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tile } from "@/components/Tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Lead, type Scheme, getLeads, getSchemes } from "@/lib/api";
import { formatRupees } from "@/lib/format";

const STATUS_VARIANT = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
} as const;

export function AdminPage() {
  const [plan, setPlan] = useState<string>("all");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSchemes().then(setSchemes).catch(() => setSchemes([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getLeads(plan === "all" ? undefined : plan)
      .then(setLeads)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [plan]);

  const planName = (id: string) => schemes.find((s) => s.id === id)?.name ?? id;

  // Stats reflect the current (filtered) view.
  const stats = useMemo(() => {
    const by = (s: Lead["status"]) => leads.filter((l) => l.status === s).length;
    return {
      total: leads.length,
      submitted: by("SUBMITTED"),
      approved: by("APPROVED"),
      totalValue: leads.reduce((sum, l) => sum + l.eligibleLoanRupees, 0),
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every application, newest first. Mobile numbers are masked.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={FileText} label="Total leads" value={String(stats.total)} />
        <Tile icon={Clock} label="Submitted" value={String(stats.submitted)} />
        <Tile icon={CheckCircle2} label="Approved" value={String(stats.approved)} />
        <Tile icon={IndianRupee} label="Loan value" value={formatRupees(stats.totalValue)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {loading ? "Loading…" : `Showing ${leads.length}`}
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </h2>
        <div className="w-full sm:w-56">
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger aria-label="Filter by plan">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {schemes.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Couldn't load leads. Is the API running?
        </CardContent></Card>
      ) : (
        <>
          {/* Desktop/tablet table */}
          <Card className="hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="text-right">Net (g)</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Loan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.applicationId}>
                    <TableCell className="font-medium">{l.applicationId}</TableCell>
                    <TableCell>{l.name}</TableCell>
                    <TableCell className="tnum">{l.mobileNumberMasked}</TableCell>
                    <TableCell className="text-right tnum">{l.netWeightGrams}</TableCell>
                    <TableCell>{planName(l.schemeId)}</TableCell>
                    <TableCell className="text-right font-medium tnum">{formatRupees(l.eligibleLoanRupees)}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[l.status]}>{l.status.replace("_", " ")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!loading && leads.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">No leads yet.</p>
            )}
          </Card>

          {/* Mobile stacked cards */}
          <div className="space-y-3 sm:hidden">
            {leads.map((l) => (
              <Card key={l.applicationId}>
                <CardContent className="space-y-1.5 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{l.applicationId}</span>
                    <Badge variant={STATUS_VARIANT[l.status]}>{l.status.replace("_", " ")}</Badge>
                  </div>
                  <p>{l.name} · <span className="tnum">{l.mobileNumberMasked}</span></p>
                  <p className="text-muted-foreground">{planName(l.schemeId)} · {l.netWeightGrams} g</p>
                  <p className="font-display text-lg font-semibold tnum text-primary">{formatRupees(l.eligibleLoanRupees)}</p>
                </CardContent>
              </Card>
            ))}
            {!loading && leads.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No leads yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
