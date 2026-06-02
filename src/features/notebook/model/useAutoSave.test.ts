import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave";
import * as notebookServiceModule from "../api/notebookService";
import type { Notebook, Cell, CodeCell } from "./types";

vi.mock("../api/notebookService", () => ({
  notebookService: { saveNotebook: vi.fn() },
}));

const mockSave = vi.mocked(notebookServiceModule.notebookService.saveNotebook);

function makeNotebook(cells: Cell[] = []): Notebook {
  return {
    id: "nb-1",
    metadata: { title: "Test" },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    cells,
  };
}

function makeCodeCell(id: string, source = ""): CodeCell {
  return {
    id,
    type: "code",
    source,
    executionCount: null,
    executionState: "idle",
    output: { type: "stream", stream: "stdout", text: "" },
  };
}

const DEBOUNCE_MS = 800;

beforeEach(() => {
  vi.useFakeTimers();
  mockSave.mockResolvedValue(undefined as never);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutoSave", () => {
  it("does not save on initial mount", () => {
    const notebook = makeNotebook([makeCodeCell("c1")]);
    renderHook(() => useAutoSave(notebook));
    vi.advanceTimersByTime(DEBOUNCE_MS + 100);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("saves after the debounce window when cells change", async () => {
    const initial = makeNotebook([makeCodeCell("c1")]);
    const edited = makeNotebook([makeCodeCell("c1", 'console.log("hi")')]);
    const { rerender } = renderHook(({ nb }) => useAutoSave(nb), {
      initialProps: { nb: initial },
    });

    rerender({ nb: edited });
    expect(mockSave).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(edited, expect.any(AbortSignal));
  });

  it("debounces: multiple rapid edits result in a single save", async () => {
    const base = makeNotebook([makeCodeCell("c1")]);
    const edit1 = makeNotebook([makeCodeCell("c1", "a")]);
    const edit2 = makeNotebook([makeCodeCell("c1", "ab")]);
    const edit3 = makeNotebook([makeCodeCell("c1", "abc")]);

    const { rerender } = renderHook(({ nb }) => useAutoSave(nb), {
      initialProps: { nb: base },
    });

    rerender({ nb: edit1 });
    vi.advanceTimersByTime(200);
    rerender({ nb: edit2 });
    vi.advanceTimersByTime(200);
    rerender({ nb: edit3 });

    await vi.runAllTimersAsync();
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(edit3, expect.any(AbortSignal));
  });

  it("does not save when only runtime fields change (executionCount, output, executionState)", async () => {
    const base = makeNotebook([makeCodeCell("c1")]);
    const afterRun = makeNotebook([
      {
        ...makeCodeCell("c1"),
        executionCount: 1,
        executionState: "idle" as const,
        output: { type: "stream" as const, stream: "stdout" as const, text: "result\n" },
      },
    ]);

    const { rerender } = renderHook(({ nb }) => useAutoSave(nb), {
      initialProps: { nb: base },
    });

    rerender({ nb: afterRun });
    await vi.runAllTimersAsync();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("cancels the debounce timer on unmount", async () => {
    const initial = makeNotebook([makeCodeCell("c1")]);
    const edited = makeNotebook([makeCodeCell("c1", "x")]);

    const { rerender, unmount } = renderHook(({ nb }) => useAutoSave(nb), {
      initialProps: { nb: initial },
    });

    rerender({ nb: edited });
    unmount();

    await vi.runAllTimersAsync();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("aborts in-flight save when a new save starts", async () => {
    let capturedSignals: AbortSignal[] = [];
    mockSave.mockImplementation((_nb, signal) => {
      capturedSignals.push(signal as AbortSignal);
      return new Promise(() => {}); // never resolves (simulates slow save)
    });

    const base = makeNotebook([makeCodeCell("c1")]);
    const edit1 = makeNotebook([makeCodeCell("c1", "x")]);
    const edit2 = makeNotebook([makeCodeCell("c1", "xy")]);

    const { rerender } = renderHook(({ nb }) => useAutoSave(nb), {
      initialProps: { nb: base },
    });

    rerender({ nb: edit1 });
    await vi.runAllTimersAsync();
    expect(capturedSignals).toHaveLength(1);
    expect(capturedSignals[0].aborted).toBe(false);

    rerender({ nb: edit2 });
    await vi.runAllTimersAsync();
    expect(capturedSignals).toHaveLength(2);
    expect(capturedSignals[0].aborted).toBe(true);
  });
});
