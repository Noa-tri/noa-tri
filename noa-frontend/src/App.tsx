import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import AthleteDetailPage from "./pages/AthleteDetailPage";
import AthletePortalPage from "./pages/AthletePortalPage";
import AthletesPage from "./pages/AthletesPage";
import BiomarkersPage from "./pages/BiomarkersPage";
import DailyLoadsPage from "./pages/DailyLoadsPage";
import DashboardPage from "./pages/DashboardPage";
import NLSSPage from "./pages/NLSSPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import PerformanceTestsPage from "./pages/PerformanceTestsPage";
import PlanningPage from "./pages/PlanningPage";
import RiskPage from "./pages/RiskPage";
import SessionsPage from "./pages/SessionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="athletes" element={<AthletesPage />} />
        <Route path="athletes/:athleteId" element={<AthleteDetailPage />} />
        <Route path="athlete/:athleteId" element={<AthletePortalPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="biomarkers" element={<BiomarkersPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="risk" element={<RiskPage />} />
        <Route path="performance-tests" element={<PerformanceTestsPage />} />
        <Route path="daily-loads" element={<DailyLoadsPage />} />
        <Route path="nlss" element={<NLSSPage />} />
      </Route>
    </Routes>
  );
}
