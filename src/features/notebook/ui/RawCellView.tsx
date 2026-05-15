import type { RawCell } from "../model/types";
import { CellEditor } from "./CellEditor";

interface RawCellViewProps {
  cell: RawCell;
}

export function RawCellView({ cell }: RawCellViewProps) {
  return <CellEditor cellId={cell.id} source={cell.source} language="plain" />;
}
