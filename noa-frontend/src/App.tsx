import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import AthletesPage from "./pages/AthletesPage";
import AthleteProfilePage from "./pages/AthleteProfilePage";
import PlanningPage from "./pages/PlanningPage";
import SessionsPage from "./pages/SessionsPage";
import BiomarkersPage from "./pages/BiomarkersPage";
import SynchronizationPage from "./pages/SynchronizationPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/athletes" element={<AthletesPage />} />
        <Route path="/athletes/:athleteId" element={<AthleteProfilePage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/biomarkers" element={<BiomarkersPage />} />
        <Route path="/synchronization" element={<SynchronizationPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}
