export type NotebookCellType = "markdown" | "code";
export type NotebookKernelStatus = "idle" | "starting" | "ready" | "error";
export type NotebookRequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface NotebookCell {
  id: string;
  type: NotebookCellType;
  title: string;
  preview: string;
}

export interface NotebookShell {
  id: string;
  title: string;
  language: string;
  kernelStatus: NotebookKernelStatus;
  cells: NotebookCell[];
}

export interface NotebookShellState {
  notebook: NotebookShell | null;
  status: NotebookRequestStatus;
  error: string | null;
}
