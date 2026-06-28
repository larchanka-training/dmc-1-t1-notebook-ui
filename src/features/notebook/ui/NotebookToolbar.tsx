import { useState } from "react";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { useExecutor } from "../model/useNotebookExecutor";
import { KernelStatus } from "./KernelStatus";
import { ThemeToggle } from "./ThemeToggle";
import { BrowserLLMStatus } from "./BrowserLLMStatus";
import { Button } from "../../../shared/ui/Button";

export function NotebookToolbar() {
  const { state, dispatch } = useNotebook();
  const { runAll, interruptWorker, isRunning } = useExecutor();
  const [pendingDeleteCellId, setPendingDeleteCellId] = useState<string | null>(null);

  const { selectedCellId } = state.ui;
  const cells = state.notebook.cells;
  const activeCell = cells.find((c) => c.id === selectedCellId) ?? null;

  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center gap-1">
        <Button
          onClick={() =>
            dispatch(notebookActions.addCell("code", selectedCellId ?? undefined))
          }
        >
          + Add cell
        </Button>

        <Button
          disabled={selectedCellId === null}
          onClick={() => {
            if (selectedCellId !== null) setPendingDeleteCellId(selectedCellId);
          }}
        >
          Delete cell
        </Button>

        <span className="mx-1 h-4 w-px bg-stone-200 dark:bg-stone-700" />

        <Button
          disabled={isRunning}
          onClick={() => void runAll()}
        >
          ▶▶ Run All
        </Button>

        <Button
          disabled={!isRunning}
          className={isRunning ? "text-red-600 hover:text-red-700" : ""}
          onClick={() => interruptWorker()}
        >
          ■ Stop
        </Button>

        <Button
          disabled={isRunning}
          onClick={() => dispatch(notebookActions.restartKernel())}
        >
          ↺ Restart
        </Button>

        <span className="mx-1 h-4 w-px bg-stone-200 dark:bg-stone-700" />

        <select
          value={activeCell?.type ?? "code"}
          disabled={activeCell === null}
          onChange={(e) => {
            if (selectedCellId !== null) {
              dispatch(
                notebookActions.changeCellType(
                  selectedCellId,
                  e.target.value as "code" | "markdown" | "raw"
                )
              );
            }
          }}
          className="rounded border border-stone-200 px-2 py-1.5 text-sm text-stone-600 hover:border-stone-300 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-500"
        >
          <option value="code">Code</option>
          <option value="markdown">Markdown</option>
          <option value="raw">Raw</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <KernelStatus />
        <span className="h-4 w-px bg-stone-200 dark:bg-stone-700" />
        <BrowserLLMStatus />
        <span className="h-4 w-px bg-stone-200 dark:bg-stone-700" />
        <ThemeToggle />
      </div>

      {pendingDeleteCellId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setPendingDeleteCellId(null)}
        >
          <div
            className="w-80 rounded-xl bg-white dark:bg-stone-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Delete cell?</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setPendingDeleteCellId(null)}>Cancel</Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  dispatch(notebookActions.deleteCell(pendingDeleteCellId));
                  setPendingDeleteCellId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
