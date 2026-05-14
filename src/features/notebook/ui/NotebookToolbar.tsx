import { useNotebook, notebookActions } from "../model/notebookContext";
import { useRunCell } from "../model/useRunCell";
import { KernelStatus } from "./KernelStatus";
import { Button } from "../../../shared/ui/Button";

export function NotebookToolbar() {
  const { state, dispatch } = useNotebook();
  const runCell = useRunCell();

  const { selectedCellId } = state.ui;
  const cells = state.notebook.cells;
  const activeCell = cells.find((c) => c.id === selectedCellId) ?? null;
  const isCodeCell = activeCell?.type === "code";

  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center gap-1">
        <Button onClick={() => console.log("save")}>
          Save
        </Button>

        <span className="mx-1 h-4 w-px bg-stone-200" />

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
            if (selectedCellId !== null)
              dispatch(notebookActions.deleteCell(selectedCellId));
          }}
        >
          Delete cell
        </Button>

        <span className="mx-1 h-4 w-px bg-stone-200" />

        <Button
          disabled={!isCodeCell}
          onClick={() => {
            if (selectedCellId !== null) void runCell(selectedCellId);
          }}
        >
          ▶ Run
        </Button>

        <Button onClick={() => dispatch(notebookActions.restartKernel())}>
          ↺ Restart
        </Button>

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
