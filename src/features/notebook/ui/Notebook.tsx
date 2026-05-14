import { useNotebook } from "../model/notebookContext";
import { NotebookToolbar } from "./NotebookToolbar";
import { NotebookCell } from "./NotebookCell";

export function Notebook() {
  const { state } = useNotebook();
  const { cells } = state.notebook;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
      <NotebookToolbar />
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          {state.notebook.metadata.title}
        </h1>
        <div className="flex flex-col gap-2">
          {cells.map((cell, index) => (
            <NotebookCell
              key={cell.id}
              cell={cell}
              index={index}
              total={cells.length}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
