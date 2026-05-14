import { useNotebook, notebookActions } from "../model/notebookContext";
import { useRunCell } from "../model/useRunCell";
import { KernelStatus } from "./KernelStatus";

export function NotebookToolbar() {
  const { state, dispatch } = useNotebook();
  const runCell = useRunCell();

  const { selectedCellId } = state.ui;
  const cells = state.notebook.cells;
  const activeCell = cells.find((c) => c.id === selectedCellId) ?? null;
  const isCodeCell = activeCell?.type === "code";

  const btnBase =
    "rounded px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => console.log("save")}
          className={btnBase}
        >
          Save
        </button>

        <span className="mx-1 h-4 w-px bg-stone-200" />

        <button
          type="button"
          onClick={() =>
            dispatch(notebookActions.addCell("code", selectedCellId ?? undefined))
          }
          className={btnBase}
        >
          + Add cell
        </button>

        <button
          type="button"
          disabled={selectedCellId === null}
          onClick={() => {
            if (selectedCellId !== null)
              dispatch(notebookActions.deleteCell(selectedCellId));
          }}
          className={btnBase}
        >
          Delete cell
        </button>

        <span className="mx-1 h-4 w-px bg-stone-200" />

        <button
          type="button"
          disabled={!isCodeCell}
          onClick={() => {
            if (selectedCellId !== null) void runCell(selectedCellId);
          }}
          className={btnBase}
        >
          ▶ Run
        </button>

        <button
          type="button"
          onClick={() => dispatch(notebookActions.restartKernel())}
          className={btnBase}
        >
          ↺ Restart
        </button>

        <span className="mx-1 h-4 w-px bg-stone-200" />

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
          className="rounded border border-stone-200 px-2 py-1.5 text-sm text-stone-600 hover:border-stone-300 disabled:opacity-40"
        >
          <option value="code">Code</option>
          <option value="markdown">Markdown</option>
          <option value="raw">Raw</option>
        </select>
      </div>

      <KernelStatus />
    </div>
  );
}
