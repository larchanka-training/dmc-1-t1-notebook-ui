import { useState } from "react";
import type { Cell } from "../model/types";
import { useNotebook, notebookActions } from "../model/notebookContext";
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
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-0.5">
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
          >▶</span>
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
