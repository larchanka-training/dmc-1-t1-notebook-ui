import type { CodeCell, CellOutput } from "../model/types";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { StreamOutputView } from "./StreamOutputView";
import { ErrorOutputView } from "./ErrorOutputView";
import { Button } from "../../../shared/ui/Button";

interface CellOutputViewProps {
  cell: CodeCell;
}

function isEmptyOutput(output: CellOutput): boolean {
  return output.type === "stream" && output.text === "";
}

function renderOutput(output: CellOutput) {
  switch (output.type) {
    case "stream":
      return <StreamOutputView output={output} />;
    case "error":
      return <ErrorOutputView output={output} />;
    case "execute_result":
      return (
        <pre className="overflow-x-auto px-4 py-3 font-mono text-xs text-stone-700">
          {output.text}
        </pre>
      );
  }
}

export function CellOutputView({ cell }: CellOutputViewProps) {
  const { dispatch } = useNotebook();
  const { output } = cell;

  if (isEmptyOutput(output)) return null;

  const collapsed = cell.metadata?.collapsed ?? false;

  return (
    <div className="border-t border-stone-100">
      <Button
        variant="text"
        size="xs"
        onClick={() => dispatch(notebookActions.toggleOutputCollapsed(cell.id))}
        className="flex items-center gap-1.5 px-4 py-1"
        aria-label={collapsed ? "Expand output" : "Collapse output"}
      >
        <span
          className={`inline-block transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        >
          ▶
        </span>
        <span>{collapsed ? "Output hidden" : "Output"}</span>
      </Button>
      {!collapsed && (
        <div className="border-t border-stone-100">{renderOutput(output)}</div>
      )}
    </div>
  );
}
