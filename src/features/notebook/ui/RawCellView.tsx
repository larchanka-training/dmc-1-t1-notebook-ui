import type { RawCell } from "../../../shared/types/notebook";
import { CellEditor } from "./CellEditor";

interface RawCellViewProps {
  cell: RawCell;
}

export function RawCellView({ cell }: RawCellViewProps) {
  return <CellEditor cellId={cell.id} source={cell.source} language="plain" />;
}
