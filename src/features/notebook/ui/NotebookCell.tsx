import type { Cell } from "../../../shared/types/notebook";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { ExecutionIndicator } from "./ExecutionIndicator";
import { CellActions } from "./CellActions";
import { CodeCellView } from "./CodeCellView";
import { MarkdownCellView } from "./MarkdownCellView";
import { RawCellView } from "./RawCellView";

interface NotebookCellProps {
  cell: Cell;
  index: number;
  total: number;
}

function CellBody({ cell }: { cell: Cell }) {
  switch (cell.type) {
    case "code":
      return <CodeCellView cell={cell} />;
    case "markdown":
      return <MarkdownCellView cell={cell} />;
    case "raw":
      return <RawCellView cell={cell} />;
  }
}

export function NotebookCell({ cell, index, total }: NotebookCellProps) {
  const { state, dispatch } = useNotebook();
  const isSelected = state.ui.selectedCellId === cell.id;

  return (
    <article
      className={`group relative flex overflow-hidden rounded-md border bg-white transition-shadow ${
        isSelected
          ? "border-stone-300 shadow-sm"
          : "border-stone-200 hover:border-stone-300"
      }`}
      onClick={() => dispatch(notebookActions.selectCell(cell.id))}
    >
      {/* Active cell left accent */}
      <div
        className={`w-0.5 flex-shrink-0 transition-colors ${
          isSelected ? "bg-blue-400" : "bg-transparent"
        }`}
      />

      {/* Gutter — execution indicator for code cells, empty space otherwise */}
      <div className="flex w-14 flex-shrink-0 items-start justify-end px-2 pt-2.5">
        {cell.type === "code" && <ExecutionIndicator cell={cell} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <CellBody cell={cell} />
      </div>

      {/* Actions — fade in on hover or when selected */}
      <div
        className={`flex flex-shrink-0 flex-col items-center px-1 pt-1.5 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <CellActions cell={cell} index={index} total={total} />
      </div>
    </article>
  );
}
