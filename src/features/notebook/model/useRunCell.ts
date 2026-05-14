import { useNotebook, notebookActions } from "./notebookContext";
import { executeCode } from "../lib/fakeKernel";

export function useRunCell() {
  const { state, dispatch } = useNotebook();

  return async (cellId: string): Promise<void> => {
    const cell = state.notebook.cells.find((c) => c.id === cellId);
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
  };
}
