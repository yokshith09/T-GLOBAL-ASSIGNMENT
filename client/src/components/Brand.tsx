import { Link } from "react-router-dom";

/** Gold ring over emerald — the Aurum mark. Links home by default. */
export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent">
        <span className="h-4 w-4 rounded-full border-2 border-primary" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">Aurum</span>
      <span className="text-sm text-muted-foreground">Gold Loans</span>
    </Link>
  );
}
