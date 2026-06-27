import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AnalyticsDashboard } from "../../features/analytics/ui/AnalyticsDashboard";
import { NotebookPage } from "../../features/notebook/ui/NotebookPage";
import { HelpPage } from "../../features/help/ui/HelpPage";

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<NotebookPage />} />
        <Route path="/:notebookId" element={<NotebookPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
