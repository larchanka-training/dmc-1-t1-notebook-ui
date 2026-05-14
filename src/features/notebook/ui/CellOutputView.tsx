import type { CodeCell, CellOutput } from "../../../shared/types/notebook";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { StreamOutputView } from "./StreamOutputView";
import { ErrorOutputView } from "./ErrorOutputView";
import { RichOutputView } from "./RichOutputView";

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
    case "display_data":
    case "execute_result":
      return <RichOutputView data={output.data} />;
  }
}

export function CellOutputView({ cell }: CellOutputViewProps) {
  const { dispatch } = useNotebook();
  const { output } = cell;

  if (isEmptyOutput(output)) return null;

  const collapsed = cell.metadata?.collapsed ?? false;

  return (
    <div className="border-t border-stone-100">
      <button
        type="button"
        onClick={() => dispatch(notebookActions.toggleOutputCollapsed(cell.id))}
        className="flex items-center gap-1.5 px-4 py-1 text-xs text-stone-400 hover:text-stone-600"
        aria-label={collapsed ? "Expand output" : "Collapse output"}
      >
        <span
          className={`inline-block transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
        >
          ▶
        </span>
        <span>{collapsed ? "Output hidden" : "Output"}</span>
      </button>
      {!collapsed && (
        <div className="border-t border-stone-100">{renderOutput(output)}</div>
      )}
    </div>
  );
}
