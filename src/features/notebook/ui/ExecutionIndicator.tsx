import type { CodeCell } from "../../../shared/types/notebook";

interface ExecutionIndicatorProps {
  cell: CodeCell;
}

export function ExecutionIndicator({ cell }: ExecutionIndicatorProps) {
  const { executionCount, executionState } = cell;

  if (executionState === "running" || executionState === "queued") {
    return (
      <span className="select-none whitespace-nowrap font-mono text-xs text-stone-400">
        In [<span className="animate-pulse">*</span>]:
      </span>
    );
  }

  if (executionState === "error") {
    return (
      <span className="select-none whitespace-nowrap font-mono text-xs text-red-500">
        In [{executionCount ?? " "}]:
      </span>
    );
  }

  return (
    <span className="select-none whitespace-nowrap font-mono text-xs text-stone-400">
      In [{executionCount === null ? " " : executionCount}]:
    </span>
  );
}
