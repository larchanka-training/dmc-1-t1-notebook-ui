import { BrowserRouter, Route, Routes } from "react-router-dom";

import { NotebookShellPage } from "../../features/notebookShell/ui/NotebookShellPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotebookShellPage />} />
      </Routes>
    </BrowserRouter>
  );
}
