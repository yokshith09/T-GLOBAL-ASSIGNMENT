import { CheckCircle2, FileText, IndianRupee, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Tile } from "@/components/Tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupees, maskMobile } from "@/lib/format";
import { MOCK_LEADS, MOCK_PLANS } from "@/lib/mock";

const STATUS_VARIANT = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
} as const;

export function AdminPage() {
  const [plan, setPlan] = useState<string>("all");
  const planName = (id: string) => MOCK_PLANS.find((p) => p.id === id)?.name ?? id;

  const leads = useMemo(
    () => (plan === "all" ? MOCK_LEADS : MOCK_LEADS.filter((l) => l.schemeId === plan)),
    [plan],
  );

  const stats = useMemo(() => {
    const submitted = MOCK_LEADS.filter((l) => l.status === "SUBMITTED").length;
    const approved = MOCK_LEADS.filter((l) => l.status === "APPROVED").length;
    const totalValue = MOCK_LEADS.reduce((sum, l) => sum + l.eligibleLoanRupees, 0);
    return { total: MOCK_LEADS.length, submitted, approved, totalValue };
  }, []);

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
        <h2 className="text-sm font-medium text-muted-foreground">
          Showing {leads.length} of {MOCK_LEADS.length}
        </h2>
        <div className="w-full sm:w-56">
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger aria-label="Filter by plan">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {MOCK_PLANS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                <TableCell className="tnum">{maskMobile(l.mobileNumber)}</TableCell>
                <TableCell className="text-right tnum">{l.netWeightGrams}</TableCell>
                <TableCell>{planName(l.schemeId)}</TableCell>
                <TableCell className="text-right font-medium tnum">{formatRupees(l.eligibleLoanRupees)}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[l.status]}>{l.status.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {leads.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No leads match this filter.</p>}
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
              <p>{l.name} · <span className="tnum">{maskMobile(l.mobileNumber)}</span></p>
              <p className="text-muted-foreground">{planName(l.schemeId)} · {l.netWeightGrams} g</p>
              <p className="font-display text-lg font-semibold tnum text-primary">{formatRupees(l.eligibleLoanRupees)}</p>
            </CardContent>
          </Card>
        ))}
        {leads.length === 0 && <p className="text-center text-sm text-muted-foreground">No leads match this filter.</p>}
      </div>
    </div>
  );
}
