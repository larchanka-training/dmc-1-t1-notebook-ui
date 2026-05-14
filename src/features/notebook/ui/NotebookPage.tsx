import { NotebookProvider, mockNotebook } from "../model/notebookContext";
import { Notebook } from "./Notebook";

export function NotebookPage() {
  return (
    <NotebookProvider
      initialNotebook={mockNotebook}
      initialSelectedCellId={mockNotebook.cells[0]?.id ?? null}
    >
      <Notebook />
    </NotebookProvider>
  );
}
