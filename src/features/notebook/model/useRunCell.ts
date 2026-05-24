import { useNotebook, notebookActions } from "./notebookContext";
import { executeCode } from "../lib/fakeKernel";

export function useRunCell() {
  const { state, dispatch } = useNotebook();

  return async (cellId: string): Promise<void> => {
    const cells = state.notebook.cells;
    const cellIndex = cells.findIndex((c) => c.id === cellId);
    const cell = cells[cellIndex];
    if (!cell || cell.type !== "code") return;

    dispatch(notebookActions.startExecution(cellId));
    const result = await executeCode(cell.source);
    dispatch(
      notebookActions.finishExecution(
        cellId,
        result.output,
        result.executionCount,
        result.status
      )
    );

    if (result.status === "ok") {
      const nextCell = cells[cellIndex + 1];
      if (nextCell) {
        dispatch(notebookActions.selectCell(nextCell.id));
      }
    }
  };
}
