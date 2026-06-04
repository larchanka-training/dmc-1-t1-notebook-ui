import { useState } from "react";
import type { Cell, CodeCell } from "../model/types";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { useRunCell } from "../model/useRunCell";
import { useExecutor } from "../model/useNotebookExecutor";
import { AiPromptModal } from "./AiPromptModal";
import { Button } from "../../../shared/ui/Button";

interface CellActionsProps {
  cell: Cell;
  index: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function CellActions({ cell, index, total, collapsed, onToggleCollapse }: CellActionsProps) {
  const { dispatch } = useNotebook();
  const runCell = useRunCell();
  const { interruptWorker } = useExecutor();
  const [aiOpen, setAiOpen] = useState(false);

  const isExecuting =
    cell.type === "code" &&
    ((cell as CodeCell).executionState === "running" ||
      (cell as CodeCell).executionState === "queued");

  return (
    <>
      <div className="flex items-center gap-0.5">
        {cell.type === "code" && (
          isExecuting ? (
            <Button
              size="sm"
              className="text-red-600 hover:text-red-700"
              title="Stop execution"
              onClick={(e) => { e.stopPropagation(); interruptWorker(); }}
            >
              ■
            </Button>
          ) : (
            <Button
              size="sm"
              title="Run cell"
              onClick={(e) => { e.stopPropagation(); void runCell(cell.id); }}
            >
              ▶
            </Button>
          )
        )}
        <Button
          size="sm"
          onClick={() => dispatch(notebookActions.moveCell(cell.id, "up"))}
          disabled={index === 0}
          title="Move up"
        >
          ↑
        </Button>
        <Button
          size="sm"
          onClick={() => dispatch(notebookActions.moveCell(cell.id, "down"))}
          disabled={index === total - 1}
          title="Move down"
        >
          ↓
        </Button>
        {cell.type === "code" && (
          <Button
            size="sm"
            onClick={() => setAiOpen(true)}
            title="Generate with AI"
          >
            ✦
          </Button>
        )}
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          title={collapsed ? "Expand cell" : "Collapse cell"}
        >
          <span
            className={`inline-block transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
          >›</span>
        </Button>
      </div>
      {cell.type === "code" && (
        <AiPromptModal
          cellId={cell.id}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
        />
      )}
    </>
  );
}
