import { BrowserRouter, Route, Routes } from "react-router-dom";

import { NotebookPage } from "../../features/notebook/ui/NotebookPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotebookPage />} />
      </Routes>
    </BrowserRouter>
  );
}
