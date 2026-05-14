import { useState } from "react";
import type { Cell } from "../../../shared/types/notebook";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { AiPromptModal } from "./AiPromptModal";

interface CellActionsProps {
  cell: Cell;
  index: number;
  total: number;
}

export function CellActions({ cell, index, total }: CellActionsProps) {
  const { dispatch } = useNotebook();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => dispatch(notebookActions.moveCell(cell.id, "up"))}
          disabled={index === 0}
          title="Move up"
          className="rounded p-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => dispatch(notebookActions.moveCell(cell.id, "down"))}
          disabled={index === total - 1}
          title="Move down"
          className="rounded p-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
        >
          ↓
        </button>
        {cell.type === "code" && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            title="Generate with AI"
            className="rounded p-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✦
          </button>
        )}
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
