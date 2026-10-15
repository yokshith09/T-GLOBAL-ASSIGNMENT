import { Bot, Calculator, FileText, Shield } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard/apply", label: "Apply", icon: FileText },
  { to: "/dashboard/assistant", label: "Assistant", icon: Bot },
  { to: "/calculator", label: "Calculator", icon: Calculator },
];

/** App chrome for Apply / Assistant / Calculator / Admin: brand + quick nav
 *  buttons (top-right) + theme toggle. Admin is reached via the Staff link.
 *  A floating Loan Assist launcher is also available for a quick chat anywhere. */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:text-foreground",
                  )
                }>
                <l.icon className="h-4 w-4" /> <span className="hidden sm:inline">{l.label}</span>
              </NavLink>
            ))}
            <NavLink to="/dashboard/admin"
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "border-accent bg-accent/10 text-accent" : "bg-card text-muted-foreground/70 hover:text-foreground",
                )
              }
              title="Staff access">
              <Shield className="h-4 w-4" /> <span className="hidden md:inline">Staff</span>
            </NavLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <Footer />
      <FloatingAssistant />
    </div>
  );
}
