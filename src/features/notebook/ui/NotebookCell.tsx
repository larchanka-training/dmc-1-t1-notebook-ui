import { useState } from "react";
import type { Cell } from "../model/types";
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
  const [collapsed, setCollapsed] = useState(false);

  const isSelectedClassNames = isSelected
    ? "border-stone-300 shadow-sm"
    : "border-stone-200 hover:border-stone-300";

  return (
    <article
      className={`group relative overflow-hidden rounded-md border transition-shadow bg-[#fbfbfa] ${isSelectedClassNames}`}
      onClick={() => dispatch(notebookActions.selectCell(cell.id))}
    >
      {/* Active cell left accent */}
      <div
        className={`w-0.5 absolute h-full transition-colors ${
          isSelected ? "bg-blue-400" : "bg-transparent"
        }`}
      />

      <div className="border-b border-stone-200">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600 flex items-center">
            {cell.type}
          </div>

          <div className="flex items-center gap-2">
            {cell.type === "code" && <ExecutionIndicator cell={cell} />}
            <CellActions cell={cell} index={index} total={total} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
          </div>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="min-w-0 flex-1 p-1">
          <CellBody cell={cell} />
        </div>
      )}
    </article>
  );
}
