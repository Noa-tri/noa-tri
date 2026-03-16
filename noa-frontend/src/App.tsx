import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import AthleteDetailPage from "./pages/AthleteDetailPage";
import AthletesPage from "./pages/AthletesPage";
import BiomarkersPage from "./pages/BiomarkersPage";
import DashboardPage from "./pages/DashboardPage";
import PlanningPage from "./pages/PlanningPage";
import RiskPage from "./pages/RiskPage";
import SessionsPage from "./pages/SessionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="athletes" element={<AthletesPage />} />
        <Route path="athletes/:athleteId" element={<AthleteDetailPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="biomarkers" element={<BiomarkersPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="risk" element={<RiskPage />} />
      </Route>
    </Routes>
  );
}
