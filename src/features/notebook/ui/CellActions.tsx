import { useState } from "react";
import type { Cell, CodeCell } from "../model/types";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { useRunCell } from "../model/useRunCell";
import { useExecutor } from "../model/useNotebookExecutor";
import { useWebLLM } from "../model/useWebLLM";
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
  const { state, dispatch } = useNotebook();
  const runCell = useRunCell();
  const { interruptWorker } = useExecutor();
  const { generate } = useWebLLM();
  const [aiOpen, setAiOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePromptAI = async () => {
    if (cell.type !== "markdown" || cell.source.trim() === "" || isGenerating) return;
    console.log("[PromptAI] starting generation for cell:", cell.id, "source:", cell.source);
    setIsGenerating(true);
    try {
      const result = await generate(cell.source);
      console.log("[PromptAI] generation complete, result length:", result.length);
      const nextCell = state.notebook.cells[index + 1];
      if (nextCell?.type === "raw") {
        dispatch(notebookActions.updateSource(nextCell.id, result));
      } else {
        const addAction = notebookActions.addCell("raw", cell.id);
        dispatch(addAction);
        if (addAction.type === "ADD_CELL") {
          dispatch(notebookActions.updateSource(addAction.newCell.id, result));
        }
      }
    } catch (err) {
      console.error("[PromptAI] generation failed:", err);
    } finally {
      console.log("[PromptAI] finally — clearing isGenerating");
      setIsGenerating(false);
    }
  };

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
        {cell.type === "markdown" && (
          <Button
            size="sm"
            onClick={() => void handlePromptAI()}
            disabled={isGenerating || cell.source.trim() === ""}
            title="Prompt AI"
          >
            {isGenerating ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            ) : (
              "✦"
            )}
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
