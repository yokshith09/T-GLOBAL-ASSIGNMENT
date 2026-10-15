import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "@/components/AdminGate";
import { AppShell } from "@/components/AppShell";
import { AdminPage } from "@/pages/AdminPage";
import { ApplyPage } from "@/pages/ApplyPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { CalculatorPage } from "@/pages/CalculatorPage";
import { LandingPage } from "@/pages/LandingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Calculator needs no account, so it stays outside /dashboard. */}
      <Route path="/calculator" element={<AppShell />}>
        <Route index element={<CalculatorPage />} />
      </Route>
      <Route path="/dashboard" element={<AppShell />}>
        <Route index element={<Navigate to="apply" replace />} />
        <Route path="apply" element={<ApplyPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="admin" element={<AdminGate><AdminPage /></AdminGate>} />
      </Route>
      {/* Legacy flat paths -> nested routes */}
      <Route path="/apply" element={<Navigate to="/dashboard/apply" replace />} />
      <Route path="/assistant" element={<Navigate to="/dashboard/assistant" replace />} />
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
