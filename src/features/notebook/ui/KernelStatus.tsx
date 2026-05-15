import { useNotebook } from "../model/notebookContext";

export function KernelStatus() {
  const { state } = useNotebook();
  const busy = state.notebook.cells.some(
    (cell) =>
      cell.type === "code" &&
      (cell.executionState === "running" || cell.executionState === "queued")
  );

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${busy ? "bg-amber-400" : "bg-green-400"}`}
      />
      <span className="text-xs text-stone-500">
        JavaScript · {busy ? "busy" : "idle"}
      </span>
    </div>
  );
}
