import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "@/pages/AdminPage";
import { ApplyPage } from "@/pages/ApplyPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/apply", label: "Apply" },
  { to: "/assistant", label: "Assistant" },
  { to: "/admin", label: "Admin" },
];

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/apply" className="flex items-center gap-2.5">
            <Emblem />
            <span className="font-display text-lg font-semibold tracking-tight">Aurum</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Gold Loans</span>
          </NavLink>
          <nav className="flex items-center gap-1 rounded-full border bg-card p-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/apply" replace />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/apply" replace />} />
        </Routes>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-5 text-xs text-muted-foreground">
          Preliminary offers only. Final loan subject to in-branch gold appraisal. Mobile numbers are masked.
        </div>
      </footer>
    </div>
  );
}

/** Minimal coin/vault emblem — gold ring over emerald. */
function Emblem() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent">
      <span className="h-4 w-4 rounded-full border-2 border-primary" />
    </span>
  );
}
