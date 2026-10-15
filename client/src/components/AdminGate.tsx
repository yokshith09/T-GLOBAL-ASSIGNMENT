import { Lock } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ponytail: cosmetic gate only — the passcode ships in the bundle, so this keeps the
// admin view out of casual sight, NOT a security boundary. A real gate needs
// server-side auth (e.g. Supabase Auth) on GET /leads.
const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE ?? "aurum-admin";
const KEY = "aurum-admin-ok";

export function AdminGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (ok) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSCODE) {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      setOk(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="mx-auto max-w-sm pt-10">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
              <Lock className="h-4 w-4 text-accent" />
            </span>
            <div>
              <h1 className="font-display text-lg font-semibold">Admin access</h1>
              <p className="text-xs text-muted-foreground">Enter the passcode to view leads.</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input id="passcode" type="password" value={value} autoFocus
                aria-invalid={error}
                onChange={(e) => { setValue(e.target.value); setError(false); }} />
              {error && <p className="text-xs text-destructive">Incorrect passcode.</p>}
            </div>
            <Button type="submit" className="w-full">Unlock</Button>
          </form>
          <p className="text-[11px] text-muted-foreground">
            Team access only. Set the passcode with <code>VITE_ADMIN_PASSCODE</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
