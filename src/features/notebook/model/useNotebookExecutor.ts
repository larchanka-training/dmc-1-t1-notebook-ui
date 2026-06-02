import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { useNotebook, notebookActions } from "./notebookContext";
import type { ErrorOutput, StreamOutput } from "./types";

// --- Worker message types ---

interface ConsoleOutputMsg {
  type: "CONSOLE_OUTPUT";
  cellId: string;
  stream: "stdout" | "stderr";
  text: string;
}

interface ExecutionErrorMsg {
  type: "EXECUTION_ERROR";
  cellId: string;
  ename: string;
  evalue: string;
  traceback: string[];
}

interface CellExecutionCompleteMsg {
  type: "CELL_EXECUTION_COMPLETE";
  cellId: string;
  executionCount: number;
}

type WorkerMessage = ConsoleOutputMsg | ExecutionErrorMsg | CellExecutionCompleteMsg;

// --- Pending cell execution tracking ---

interface PendingExecution {
  resolve: () => void;
  outputChunks: string[];
  errorChunks: string[];
}

// --- Context ---

interface ExecutorContextValue {
  runCell: (cellId: string) => Promise<void>;
  runAll: () => Promise<void>;
  interruptWorker: () => void;
  isRunning: boolean;
}

const ExecutorContext = createContext<ExecutorContextValue | null>(null);

export function useExecutor(): ExecutorContextValue {
  const ctx = useContext(ExecutorContext);
  if (ctx === null) throw new Error("useExecutor must be used inside ExecutorProvider");
  return ctx;
}

// --- Provider ---

interface ExecutorProviderProps {
  children: ReactNode;
}

export function ExecutorProvider({ children }: ExecutorProviderProps) {
  const { state, dispatch } = useNotebook();
  // Keep a stable ref to state.notebook.cells so callbacks don't capture stale closures
  const cellsRef = useRef(state.notebook.cells);
  cellsRef.current = state.notebook.cells;

  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingExecution>>(new Map());
  const interruptedRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const updateRunning = useCallback(() => {
    setIsRunning(pendingRef.current.size > 0);
  }, []);

  // Create a fresh worker and wire up its message handler
  const createWorker = useCallback(() => {
    const worker = new Worker(
      new URL("../lib/jsExecutor.worker.js", import.meta.url),
      { type: "classic" }
    );

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;

      if (msg.type === "CONSOLE_OUTPUT") {
        const pending = pendingRef.current.get(msg.cellId);
        if (!pending) return;
        if (msg.stream === "stderr") {
          pending.errorChunks.push(msg.text);
        } else {
          pending.outputChunks.push(msg.text);
        }
        return;
      }

      if (msg.type === "EXECUTION_ERROR") {
        const pending = pendingRef.current.get(msg.cellId);
        pendingRef.current.delete(msg.cellId);
        const errorOutput: ErrorOutput = {
          type: "error",
          ename: msg.ename,
          evalue: msg.evalue,
          traceback: msg.traceback,
        };
        dispatch(
          notebookActions.finishExecution(msg.cellId, errorOutput, 0, "error")
        );
        pending?.resolve();
        updateRunning();
        return;
      }

      if (msg.type === "CELL_EXECUTION_COMPLETE") {
        const pending = pendingRef.current.get(msg.cellId);
        if (!pending) return; // spurious COMPLETE after interrupt or duplicate fire
        pendingRef.current.delete(msg.cellId);

        const allText = [
          ...pending?.outputChunks ?? [],
          ...(pending?.errorChunks?.length
            ? pending.errorChunks
            : []),
        ].join("");

        const streamOutput: StreamOutput = {
          type: "stream",
          stream: pending?.errorChunks?.length ? "stderr" : "stdout",
          text: allText,
        };

        dispatch(
          notebookActions.finishExecution(
            msg.cellId,
            streamOutput,
            msg.executionCount,
            "ok"
          )
        );

        // Advance selection to next cell on single-cell run
        const cells = cellsRef.current;
        const idx = cells.findIndex((c) => c.id === msg.cellId);
        if (idx !== -1 && idx < cells.length - 1) {
          dispatch(notebookActions.selectCell(cells[idx + 1].id));
        }

        pending?.resolve();
        updateRunning();
      }
    };

    worker.onerror = (e) => {
      console.error("[ExecutorWorker] Uncaught error:", e.message);
    };

    workerRef.current = worker;
    return worker;
  }, [dispatch, updateRunning]);

  // Boot worker on mount, tear down on unmount
  useEffect(() => {
    createWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  // --- runCell ---
  const runCell = useCallback(
    (cellId: string): Promise<void> => {
      const cells = cellsRef.current;
      const cell = cells.find((c) => c.id === cellId);
      if (!cell || cell.type !== "code") return Promise.resolve();
      if (!workerRef.current) return Promise.resolve();

      dispatch(notebookActions.startExecution(cellId));

      return new Promise<void>((resolve) => {
        pendingRef.current.set(cellId, {
          resolve,
          outputChunks: [],
          errorChunks: [],
        });
        updateRunning();
        workerRef.current!.postMessage({
          type: "EXECUTE_CELL",
          cellId,
          code: cell.source,
        });
      });
    },
    [dispatch, updateRunning]
  );

  // --- runAll ---
  const runAll = useCallback(async (): Promise<void> => {
    const cells = cellsRef.current;
    const codeCells = cells.filter(
      (c) => c.type === "code" && c.source.trim().length > 0
    );
    if (codeCells.length === 0) return;

    interruptedRef.current = false;

    // Mark all as queued upfront
    for (const cell of codeCells) {
      dispatch(notebookActions.queueCell(cell.id));
    }

    for (const cell of codeCells) {
      if (interruptedRef.current) break;
      await runCell(cell.id);
    }
  }, [dispatch, runCell]);

  // --- interruptWorker ---
  const interruptWorker = useCallback(() => {
    interruptedRef.current = true;

    // Unblock any waiting runAll promises before terminating
    for (const pending of pendingRef.current.values()) {
      pending.resolve();
    }
    pendingRef.current.clear();

    workerRef.current?.terminate();
    workerRef.current = null;

    // Reset all cells to idle and clear execution state
    dispatch(notebookActions.restartKernel());

    createWorker();
    setIsRunning(false);
  }, [dispatch, createWorker]);

  const value: ExecutorContextValue = { runCell, runAll, interruptWorker, isRunning };

  return createElement(ExecutorContext.Provider, { value }, children);
}
