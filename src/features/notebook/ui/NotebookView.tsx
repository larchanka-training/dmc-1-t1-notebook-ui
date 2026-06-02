import { useEffect } from "react";
import type { NotebookRequestStatus } from "../model/types";
import { NotebookToolbar } from "./NotebookToolbar";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { useAutoSave } from "../model/useAutoSave";
import { NotebookCell } from "./NotebookCell";
import { ExecutorProvider } from "../model/useNotebookExecutor";

interface NotebookViewProps {
  notebookStatus: NotebookRequestStatus;
  error: string | null;
  titleSync?: { id: string; title: string };
}

export function NotebookView({
  notebookStatus,
  error,
  titleSync,
}: NotebookViewProps) {
  const { state, dispatch } = useNotebook();
  const { cells } = state.notebook;

  useAutoSave(state.notebook);

  // Sync title into context after a sidebar rename without remounting the provider.
  useEffect(() => {
    if (titleSync && titleSync.id === state.notebook.id && titleSync.title !== state.notebook.metadata.title) {
      dispatch(notebookActions.updateTitle(titleSync.title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleSync]);

  const isNotebookLoading = notebookStatus === "loading" || notebookStatus === "idle";

  return (
    <ExecutorProvider>
    <main className="flex flex-1 h-screen flex-col px-6 py-4 text-stone-800 overflow-hidden">
      <section className="mb-4">
        {isNotebookLoading ? (
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="animate-pulse text-stone-400">Loading…</span>
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {state.notebook.metadata.title}
          </h1>
        )}
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

        {isNotebookLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading notebook…</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 flex-1 overflow-scroll">
            <div className="flex flex-col gap-4">
              {cells.map((cell, index) => (
                <NotebookCell key={cell.id} cell={cell} index={index} total={cells.length} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
    </ExecutorProvider>
  );
}
