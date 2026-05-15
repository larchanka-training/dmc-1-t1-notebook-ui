import type { CodeCell } from "../model/types";

interface ExecutionIndicatorProps {
  cell: CodeCell;
}

export function ExecutionIndicator({ cell }: ExecutionIndicatorProps) {
  const { executionCount, executionState } = cell;

  if (executionState === "running" || executionState === "queued") {
    return (
      <span className="select-none whitespace-nowrap font-mono text-xs text-stone-400">
        Running [<span className="animate-pulse">*</span>]:
      </span>
    );
  }

  if (executionState === "error") {
    return (
      <span className="select-none whitespace-nowrap font-mono text-xs text-red-500">
        Exec. times [{executionCount ?? " "}]:
      </span>
    );
  }

  return (
    <span className="select-none whitespace-nowrap font-mono text-xs text-stone-400">
      Exec. times [{executionCount === null ? "-" : executionCount}]
    </span>
  );
}
