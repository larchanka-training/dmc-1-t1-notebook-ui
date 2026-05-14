import type { CodeCell } from "../../../shared/types/notebook";
import { CellEditor } from "./CellEditor";
import { CellOutputView } from "./CellOutputView";

interface CodeCellViewProps {
  cell: CodeCell;
}

export function CodeCellView({ cell }: CodeCellViewProps) {
  return (
    <>
      <CellEditor cellId={cell.id} source={cell.source} language="javascript" />
      <CellOutputView cell={cell} />
    </>
  );
}
