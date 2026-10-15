import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "@/components/AdminGate";
import { AdminPage } from "@/pages/AdminPage";
import { ApplyPage } from "@/pages/ApplyPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { FaqPage } from "@/pages/FaqPage";
import { HowItWorksPage } from "@/pages/HowItWorksPage";
import { LandingPage } from "@/pages/LandingPage";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Home", end: true },
  { to: "/how-it-works", label: "How it works" },
  { to: "/faq", label: "FAQ" },
  { to: "/apply", label: "Apply" },
  { to: "/assistant", label: "Assistant" },
  { to: "/admin", label: "Admin" },
];

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Emblem />
            <span className="font-display text-lg font-semibold tracking-tight">Aurum</span>
            <span className="text-sm text-muted-foreground">Gold Loans</span>
          </NavLink>
          <nav className="-mx-4 flex items-center gap-1 overflow-x-auto rounded-full border bg-card p-1 px-4 sm:mx-0 sm:px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/admin" element={<AdminGate><AdminPage /></AdminGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
