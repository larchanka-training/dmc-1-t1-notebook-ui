import { describe, it, expect } from "vitest";
import reducer from "./notebookSlice";
import { fetchNotebook } from "./notebookThunks";
import type { NotebookShell, NotebookShellState } from "./types";

const initialState: NotebookShellState = {
  notebook: null,
  status: "idle",
  error: null,
};

const stubNotebook: NotebookShell = {
  id: "nb-1",
  title: "Test Notebook",
  language: "javascript",
  kernelStatus: "ready",
  cells: [
    { id: "c-1", type: "code", title: "Cell 1", preview: "console.log(1)" },
  ],
};

describe("notebookSlice reducer", () => {
  it("returns initial state for unknown action", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("sets status to loading and clears error on pending", () => {
    const stateWithError: NotebookShellState = {
      ...initialState,
      status: "failed",
      error: "previous error",
    };
    const state = reducer(
      stateWithError,
      fetchNotebook.pending("req-id", "nb-1")
    );

    expect(state.status).toBe("loading");
    expect(state.error).toBeNull();
    expect(state.notebook).toBeNull();
  });

  it("sets notebook and status to succeeded on fulfilled", () => {
    const state = reducer(
      { ...initialState, status: "loading" },
      fetchNotebook.fulfilled(stubNotebook, "req-id", "nb-1")
    );

    expect(state.status).toBe("succeeded");
    expect(state.notebook).toEqual(stubNotebook);
    expect(state.error).toBeNull();
  });

  it("sets error and status to failed on rejected with rejectValue", () => {
    const state = reducer(
      { ...initialState, status: "loading" },
      fetchNotebook.rejected(null, "req-id", "nb-1", "Network error")
    );

    expect(state.status).toBe("failed");
    expect(state.error).toBe("Network error");
    expect(state.notebook).toBeNull();
  });

  it("falls back to default error message on rejected without rejectValue", () => {
    const state = reducer(
      { ...initialState, status: "loading" },
      fetchNotebook.rejected(null, "req-id", "nb-1", undefined)
    );

    expect(state.status).toBe("failed");
    expect(state.error).toBe("Failed to load notebook");
  });

  it("preserves existing notebook when loading a new one", () => {
    const stateWithNotebook: NotebookShellState = {
      notebook: stubNotebook,
      status: "succeeded",
      error: null,
    };
    const state = reducer(
      stateWithNotebook,
      fetchNotebook.pending("req-id", "nb-2")
    );

    expect(state.status).toBe("loading");
    expect(state.notebook).toEqual(stubNotebook);
  });
});
