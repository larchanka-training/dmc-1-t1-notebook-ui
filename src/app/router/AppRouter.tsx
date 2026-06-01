import { BrowserRouter, Route, Routes } from "react-router-dom";

import { NotebookPage } from "../../features/notebook/ui/NotebookPage";
import { HelpPage } from "../../features/help/ui/HelpPage";

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<NotebookPage />} />
        <Route path="/:notebookId" element={<NotebookPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
