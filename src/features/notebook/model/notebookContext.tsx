/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import type {
  Cell,
  CodeCell,
  CellOutput,
  Notebook,
  StreamOutput,
} from "./types";

// ---- Local UI state (not persisted) ----

interface NotebookUIState {
  selectedCellId: string | null;
}

interface State {
  notebook: Notebook;
  ui: NotebookUIState;
}

// ---- Helpers ----

function emptyOutput(): StreamOutput {
  return { type: "stream", stream: "stdout", text: "" };
}

function buildCell(cellType: "code" | "markdown" | "raw", id: string): Cell {
  switch (cellType) {
    case "code":
      return {
        id,
        source: "",
        type: "code",
        executionCount: null,
        executionState: "idle",
        output: emptyOutput(),
      };
    case "markdown":
      return { id, source: "", type: "markdown" };
    case "raw":
      return { id, source: "", type: "raw" };
  }
}

// ---- Mock notebook ----

// Empty-text stream output is the "no output yet" sentinel.
// CellOutputView renders nothing when output is a stream with empty text.
export const mockNotebook: Notebook = {
  id: "notebook-demo-001",
  metadata: { title: "Welcome Notebook" },
  createdAt: "2025-01-15T10:00:00.000Z",
  updatedAt: "2025-01-15T10:05:00.000Z",
  cells: [
    {
      id: "cell-001",
      type: "markdown",
      source: "# Welcome\n\nThis is a small notebook demo.",
    },
    {
      id: "cell-002",
      type: "code",
      source: 'console.log("hello world")',
      executionCount: 1,
      executionState: "idle",
      output: { type: "stream", stream: "stdout", text: "hello world\n" },
    },
    {
      id: "cell-003",
      type: "code",
      source: "",
      executionCount: null,
      executionState: "idle",
      output: emptyOutput(),
    },
  ],
};

// ---- Actions ----

type Action =
  | { type: "ADD_CELL"; newCell: Cell; afterCellId?: string; now: string }
  | { type: "DELETE_CELL"; cellId: string; now: string }
  | { type: "UPDATE_CELL_SOURCE"; cellId: string; source: string; now: string }
  | { type: "CHANGE_CELL_TYPE"; cellId: string; newType: "code" | "markdown" | "raw"; now: string }
  | { type: "MOVE_CELL"; cellId: string; direction: "up" | "down"; now: string }
  | { type: "SELECT_CELL"; cellId: string | null }
  | { type: "START_EXECUTION"; cellId: string; now: string }
  | { type: "FINISH_EXECUTION"; cellId: string; output: CellOutput; executionCount: number; status: "ok" | "error"; now: string }
  | { type: "RESTART_KERNEL"; now: string }
  | { type: "TOGGLE_OUTPUT_COLLAPSED"; cellId: string; now: string };

// ---- Action creators (inject non-deterministic values) ----

export const notebookActions = {
  addCell: (cellType: "code" | "markdown" | "raw", afterCellId?: string): Action => ({
    type: "ADD_CELL",
    newCell: buildCell(cellType, crypto.randomUUID()),
    afterCellId,
    now: new Date().toISOString(),
  }),
  deleteCell: (cellId: string): Action => ({
    type: "DELETE_CELL",
    cellId,
    now: new Date().toISOString(),
  }),
  updateSource: (cellId: string, source: string): Action => ({
    type: "UPDATE_CELL_SOURCE",
    cellId,
    source,
    now: new Date().toISOString(),
  }),
  changeCellType: (cellId: string, newType: "code" | "markdown" | "raw"): Action => ({
    type: "CHANGE_CELL_TYPE",
    cellId,
    newType,
    now: new Date().toISOString(),
  }),
  moveCell: (cellId: string, direction: "up" | "down"): Action => ({
    type: "MOVE_CELL",
    cellId,
    direction,
    now: new Date().toISOString(),
  }),
  selectCell: (cellId: string | null): Action => ({
    type: "SELECT_CELL",
    cellId,
  }),
  startExecution: (cellId: string): Action => ({
    type: "START_EXECUTION",
    cellId,
    now: new Date().toISOString(),
  }),
  finishExecution: (
    cellId: string,
    output: CellOutput,
    executionCount: number,
    status: "ok" | "error"
  ): Action => ({
    type: "FINISH_EXECUTION",
    cellId,
    output,
    executionCount,
    status,
    now: new Date().toISOString(),
  }),
  restartKernel: (): Action => ({
    type: "RESTART_KERNEL",
    now: new Date().toISOString(),
  }),
  toggleOutputCollapsed: (cellId: string): Action => ({
    type: "TOGGLE_OUTPUT_COLLAPSED",
    cellId,
    now: new Date().toISOString(),
  }),
};

// ---- Reducer (pure) ----

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_CELL": {
      const cells = [...state.notebook.cells];
      if (action.afterCellId !== undefined) {
        const idx = cells.findIndex((c) => c.id === action.afterCellId);
        if (idx !== -1) {
          cells.splice(idx + 1, 0, action.newCell);
        } else {
          cells.push(action.newCell);
        }
      } else {
        cells.push(action.newCell);
      }
      return {
        notebook: { ...state.notebook, cells, updatedAt: action.now },
        ui: { selectedCellId: action.newCell.id },
      };
    }

    case "DELETE_CELL": {
      const cells = state.notebook.cells;
      const idx = cells.findIndex((c) => c.id === action.cellId);
      if (idx === -1) return state;
      const newCells = cells.filter((c) => c.id !== action.cellId);
      let selectedCellId = state.ui.selectedCellId;
      if (selectedCellId === action.cellId) {
        if (newCells.length === 0) {
          selectedCellId = null;
        } else if (idx > 0) {
          selectedCellId = newCells[idx - 1]?.id ?? null;
        } else {
          selectedCellId = newCells[0]?.id ?? null;
        }
      }
      return {
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
        ui: { selectedCellId },
      };
    }

    case "UPDATE_CELL_SOURCE": {
      const newCells = state.notebook.cells.map((cell) =>
        cell.id === action.cellId ? { ...cell, source: action.source } : cell
      );
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    case "CHANGE_CELL_TYPE": {
      const newCells = state.notebook.cells.map((cell): Cell => {
        if (cell.id !== action.cellId) return cell;
        switch (action.newType) {
          case "code":
            return {
              id: cell.id,
              source: cell.source,
              metadata: cell.metadata,
              type: "code",
              executionCount: null,
              executionState: "idle",
              output: emptyOutput(),
            };
          case "markdown":
            return { id: cell.id, source: cell.source, metadata: cell.metadata, type: "markdown" };
          case "raw":
            return { id: cell.id, source: cell.source, metadata: cell.metadata, type: "raw" };
        }
      });
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    case "MOVE_CELL": {
      const cells = [...state.notebook.cells];
      const idx = cells.findIndex((c) => c.id === action.cellId);
      if (idx === -1) return state;
      if (action.direction === "up" && idx === 0) return state;
      if (action.direction === "down" && idx === cells.length - 1) return state;
      const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
      const tmp = cells[idx];
      cells[idx] = cells[swapIdx];
      cells[swapIdx] = tmp;
      return {
        ...state,
        notebook: { ...state.notebook, cells, updatedAt: action.now },
      };
    }

    case "SELECT_CELL":
      return { ...state, ui: { selectedCellId: action.cellId } };

    case "START_EXECUTION": {
      const newCells = state.notebook.cells.map((cell): Cell => {
        if (cell.id !== action.cellId || cell.type !== "code") return cell;
        return { ...cell, executionState: "running", output: emptyOutput() };
      });
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    case "FINISH_EXECUTION": {
      const newCells = state.notebook.cells.map((cell): Cell => {
        if (cell.id !== action.cellId || cell.type !== "code") return cell;
        const executionState: CodeCell["executionState"] =
          action.status === "ok" ? "idle" : "error";
        return {
          ...cell,
          executionState,
          output: action.output,
          executionCount: action.executionCount,
        };
      });
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    case "RESTART_KERNEL": {
      const newCells = state.notebook.cells.map((cell): Cell => {
        if (cell.type !== "code") return cell;
        return { ...cell, executionCount: null, executionState: "idle", output: emptyOutput() };
      });
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    case "TOGGLE_OUTPUT_COLLAPSED": {
      const newCells = state.notebook.cells.map((cell) => {
        if (cell.id !== action.cellId) return cell;
        return {
          ...cell,
          metadata: { ...cell.metadata, collapsed: !(cell.metadata?.collapsed ?? false) },
        };
      });
      return {
        ...state,
        notebook: { ...state.notebook, cells: newCells, updatedAt: action.now },
      };
    }

    default:
      return state;
  }
}

// ---- Context, Provider, hook ----

interface NotebookContextValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const NotebookContext = createContext<NotebookContextValue | null>(null);

interface NotebookProviderProps {
  initialNotebook: Notebook;
  initialSelectedCellId: string | null;
  children: ReactNode;
}

export function NotebookProvider({
  initialNotebook,
  initialSelectedCellId,
  children,
}: NotebookProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    notebook: initialNotebook,
    ui: { selectedCellId: initialSelectedCellId },
  });

  return (
    <NotebookContext.Provider value={{ state, dispatch }}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook(): NotebookContextValue {
  const ctx = useContext(NotebookContext);
  if (ctx === null) throw new Error("useNotebook must be used inside NotebookProvider");
  return ctx;
}
