import type { NotebookRequestStatus, NotebookShell } from "../model/types";
import { NotebookToolbar } from "./NotebookToolbar";
import { useNotebook } from "../model/notebookContext";
import { NotebookCell } from "./NotebookCell";

interface NotebookViewProps {
  notebook: NotebookShell | null;
  status: NotebookRequestStatus;
  error: string | null;
}

export function NotebookView({
  notebook,
  status,
  error
}: NotebookViewProps) {
  const { state } = useNotebook();
  const { cells } = state.notebook;

  return (
    <main className="mx-auto flex h-screen w-full max-w-5xl flex-col px-4 py-4 text-stone-800 sm:px-6 lg:px-8 flex-1">
      <section className="mb-4 flex flex-col gap-4 border-b border-stone-200 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
            Notebook
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            {notebook?.title ?? "Loading notebook..."}
          </h1>
        </div>
        <span className="inline-flex w-fit rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-medium text-stone-600 shadow-sm">
          {status}
        </span>
      </section>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col flex-1 min-h-0 rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-stone-200 px-4 py-2">
          <NotebookToolbar />
        </div>

        <div className="flex flex-col gap-3 p-4 flex-1 overflow-scroll">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            {state.notebook.metadata.title}
          </h1>

          <div className="flex flex-col gap-4">
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
      </section>
    </main>
  );
}
