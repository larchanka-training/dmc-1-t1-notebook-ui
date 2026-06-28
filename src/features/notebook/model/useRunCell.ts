import { useExecutor } from "./useNotebookExecutor";

export function useRunCell() {
  const { runCell } = useExecutor();
  return runCell;
}
