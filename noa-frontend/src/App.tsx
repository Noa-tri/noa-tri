import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="athletes" element={<DashboardPage />} />
        <Route path="sessions" element={<DashboardPage />} />
        <Route path="biomarkers" element={<DashboardPage />} />
        <Route path="planning" element={<DashboardPage />} />
        <Route path="risk" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
