import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGate } from "@/components/AdminGate";
import { AppShell } from "@/components/AppShell";
import { AdminPage } from "@/pages/AdminPage";
import { ApplyPage } from "@/pages/ApplyPage";
import { CalculatorPage } from "@/pages/CalculatorPage";
import { LandingPage } from "@/pages/LandingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppShell />}>
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/admin" element={<AdminGate><AdminPage /></AdminGate>} />
      </Route>
      {/* Legacy dashboard paths → new flat routes */}
      <Route path="/dashboard/calculator" element={<Navigate to="/calculator" replace />} />
      <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
      <Route path="/dashboard/*" element={<Navigate to="/apply" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
