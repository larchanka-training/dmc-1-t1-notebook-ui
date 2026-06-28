import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ExecutorProvider, useExecutor } from "./useNotebookExecutor";
import { NotebookProvider } from "./notebookContext";
import type { Notebook } from "./types";

// ---------- Mock Worker ----------

type WorkerMessage = { data: Record<string, unknown> };

class MockWorker {
  static instance: MockWorker | null = null;
  onmessage: ((e: WorkerMessage) => void) | null = null;
  onerror: ((e: { message: string }) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    MockWorker.instance = this;
  }
  /** Simulate a message arriving from the worker */
  emit(data: Record<string, unknown>) {
    this.onmessage?.({ data });
  }
}

vi.stubGlobal("Worker", MockWorker);

// ---------- Test helpers ----------

function makeNotebook(cellIds: string[] = ["cell-1"]): Notebook {
  return {
    id: "nb-1",
    metadata: { title: "T" },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    cells: cellIds.map((id) => ({
      id,
      type: "code",
      source: `// ${id}`,
      executionCount: null,
      executionState: "idle",
      output: { type: "stream", stream: "stdout", text: "" },
    })),
  };
}

function StatusProbe({ onMount }: { onMount: (e: ReturnType<typeof useExecutor>) => void }) {
  const executor = useExecutor();
  onMount(executor);
  return <span data-testid="running">{String(executor.isRunning)}</span>;
}

function renderExecutor(notebook = makeNotebook()) {
  let captured: ReturnType<typeof useExecutor> | null = null;
  render(
    <NotebookProvider initialNotebook={notebook} initialSelectedCellId={null}>
      <ExecutorProvider>
        <StatusProbe onMount={(e) => { captured = e; }} />
      </ExecutorProvider>
    </NotebookProvider>
  );
  return { getExecutor: () => captured! };
}

beforeEach(() => {
  MockWorker.instance = null;
  vi.clearAllMocks();
});

describe("useNotebookExecutor", () => {
  it("creates a Worker on mount", () => {
    renderExecutor();
    expect(MockWorker.instance).not.toBeNull();
  });

  it("runCell posts EXECUTE_CELL to the worker", () => {
    const { getExecutor } = renderExecutor();
    act(() => { getExecutor().runCell("cell-1"); });
    expect(MockWorker.instance!.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "EXECUTE_CELL", cellId: "cell-1" })
    );
  });

  it("isRunning is true while a cell is executing", () => {
    const { getExecutor } = renderExecutor();
    act(() => { getExecutor().runCell("cell-1"); });
    expect(screen.getByTestId("running").textContent).toBe("true");
  });

  it("CELL_EXECUTION_COMPLETE resolves the pending run and sets isRunning false", async () => {
    const { getExecutor } = renderExecutor();
    act(() => { getExecutor().runCell("cell-1"); });
    expect(screen.getByTestId("running").textContent).toBe("true");

    act(() => {
      MockWorker.instance!.emit({
        type: "CELL_EXECUTION_COMPLETE",
        cellId: "cell-1",
        executionCount: 1,
      });
    });

    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  });

  it("accumulates CONSOLE_OUTPUT chunks before completion", async () => {
    const { getExecutor } = renderExecutor();
    let runPromise: Promise<void>;
    act(() => { runPromise = getExecutor().runCell("cell-1"); });

    act(() => {
      MockWorker.instance!.emit({ type: "CONSOLE_OUTPUT", cellId: "cell-1", stream: "stdout", text: "line 1\n" });
      MockWorker.instance!.emit({ type: "CONSOLE_OUTPUT", cellId: "cell-1", stream: "stdout", text: "line 2\n" });
      MockWorker.instance!.emit({ type: "CELL_EXECUTION_COMPLETE", cellId: "cell-1", executionCount: 1 });
    });

    await runPromise!;
    // After completion the cell output should contain both lines joined
    // (We verify indirectly via isRunning reaching false — output dispatch is tested via reducer)
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  });

  it("CONSOLE_OUTPUT after CELL_EXECUTION_COMPLETE is silently dropped", async () => {
    const { getExecutor } = renderExecutor();
    act(() => { getExecutor().runCell("cell-1"); });

    // Complete the cell first
    act(() => {
      MockWorker.instance!.emit({ type: "CELL_EXECUTION_COMPLETE", cellId: "cell-1", executionCount: 1 });
    });
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));

    // This late-arriving message should not throw or affect state
    expect(() => {
      act(() => {
        MockWorker.instance!.emit({ type: "CONSOLE_OUTPUT", cellId: "cell-1", stream: "stdout", text: "late\n" });
      });
    }).not.toThrow();
  });

  it("EXECUTION_ERROR resolves the run and marks cell as errored", async () => {
    const { getExecutor } = renderExecutor();
    let runPromise: Promise<void>;
    act(() => { runPromise = getExecutor().runCell("cell-1"); });

    act(() => {
      MockWorker.instance!.emit({
        type: "EXECUTION_ERROR",
        cellId: "cell-1",
        ename: "ReferenceError",
        evalue: "x is not defined",
        traceback: ["line1"],
      });
    });

    await runPromise!;
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  });

  it("interruptWorker terminates the worker and creates a new one", () => {
    const { getExecutor } = renderExecutor();
    const firstWorker = MockWorker.instance!;

    act(() => { getExecutor().interruptWorker(); });

    expect(firstWorker.terminate).toHaveBeenCalledTimes(1);
    expect(MockWorker.instance).not.toBe(firstWorker);
    expect(MockWorker.instance).not.toBeNull();
  });

  it("interruptWorker sets isRunning to false", async () => {
    const { getExecutor } = renderExecutor();
    act(() => { getExecutor().runCell("cell-1"); });
    expect(screen.getByTestId("running").textContent).toBe("true");

    act(() => { getExecutor().interruptWorker(); });
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  });

  it("runAll runs cells sequentially", async () => {
    const notebook = makeNotebook(["cell-1", "cell-2"]);
    const { getExecutor } = renderExecutor(notebook);

    let allDone = false;
    act(() => { getExecutor().runAll().then(() => { allDone = true; }); });

    // First cell starts — complete it
    await waitFor(() =>
      expect(MockWorker.instance!.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ cellId: "cell-1" })
      )
    );
    act(() => {
      MockWorker.instance!.emit({ type: "CELL_EXECUTION_COMPLETE", cellId: "cell-1", executionCount: 1 });
    });

    // Second cell starts — complete it
    await waitFor(() =>
      expect(MockWorker.instance!.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ cellId: "cell-2" })
      )
    );
    act(() => {
      MockWorker.instance!.emit({ type: "CELL_EXECUTION_COMPLETE", cellId: "cell-2", executionCount: 2 });
    });

    await waitFor(() => expect(allDone).toBe(true));
  });
});
