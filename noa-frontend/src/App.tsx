import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OrganizationsPage from "./pages/OrganizationsPage";
import AthletesPage from "./pages/AthletesPage";
import PlanningPage from "./pages/PlanningPage";
import SessionsPage from "./pages/SessionsPage";
import BiomarkersPage from "./pages/BiomarkersPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">NOA TRI</p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-slate-300">Module ready for next integration pass.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/organizations" element={<OrganizationsPage />} />
      <Route path="/athletes" element={<AthletesPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
      <Route path="/biomarkers" element={<BiomarkersPage />} />
      <Route path="/planning" element={<PlanningPage />} />

      <Route path="/risk" element={<PlaceholderPage title="Risk" />} />
      <Route path="/performance-tests" element={<PlaceholderPage title="Performance Tests" />} />
      <Route path="/daily-loads" element={<PlaceholderPage title="Daily Loads" />} />
      <Route path="/nlss" element={<PlaceholderPage title="NLSS" />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
