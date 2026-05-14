export interface Notebook {
  id: string;
  metadata: NotebookMetadata;
  cells: Cell[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface NotebookMetadata {
  title: string;
  custom?: Record<string, unknown>;
}

export type Cell = CodeCell | MarkdownCell | RawCell;

export interface CellBase {
  id: string;
  source: string;
  metadata?: CellMetadata;
}

export interface CodeCell extends CellBase {
  type: "code";
  executionCount: number | null;
  output: CellOutput;
  executionState: ExecutionState;
}

export interface MarkdownCell extends CellBase {
  type: "markdown";
}

export interface RawCell extends CellBase {
  type: "raw";
}

export interface CellMetadata {
  collapsed?: boolean;
  custom?: Record<string, unknown>;
}

export type ExecutionState = "idle" | "queued" | "running" | "error";

export type CellOutput =
  | StreamOutput
  | DisplayDataOutput
  | ExecuteResultOutput
  | ErrorOutput;

export interface StreamOutput {
  type: "stream";
  stream: "stdout" | "stderr";
  text: string;
}

export interface DisplayDataOutput {
  type: "display_data";
  data: MimeBundle;
  metadata?: Record<string, unknown>;
}

export interface ExecuteResultOutput {
  type: "execute_result";
  data: MimeBundle;
  metadata?: Record<string, unknown>;
}

export interface ErrorOutput {
  type: "error";
  ename: string;
  evalue: string;
  traceback: string[];
}

export type MimeBundle = {
  "text/plain"?: string;
  "text/html"?: string;
  "image/png"?: string;
  "image/jpeg"?: string;
  "image/svg+xml"?: string;
  "application/json"?: unknown;
} & Record<string, unknown>;

export interface NotebookUIState {
  selectedCellId: string | null;
}
