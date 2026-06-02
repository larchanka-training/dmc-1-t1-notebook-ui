import { describe, it, expect } from "vitest";
import { reducer } from "./notebookContext";
import type { Cell, CodeCell, Notebook, StreamOutput } from "./types";

const NOW = "2025-01-01T00:00:00.000Z";

function makeCodeCell(id: string, overrides: Partial<CodeCell> = {}): CodeCell {
  return {
    id,
    type: "code",
    source: "",
    executionCount: null,
    executionState: "idle",
    output: { type: "stream", stream: "stdout", text: "" },
    metadata: { collapsed: false },
    ...overrides,
  };
}

function makeNotebook(cells: Cell[]): Notebook {
  return {
    id: "nb-1",
    metadata: { title: "Test" },
    createdAt: NOW,
    updatedAt: NOW,
    cells,
  };
}

function makeState(cells: Cell[], selectedCellId: string | null = null) {
  return { notebook: makeNotebook(cells), ui: { selectedCellId } };
}

const c1 = makeCodeCell("c1");
const c2 = makeCodeCell("c2");
const c3 = makeCodeCell("c3");

describe("notebookContext reducer", () => {
  describe("ADD_CELL", () => {
    it("appends when afterCellId is omitted", () => {
      const state = makeState([c1]);
      const next = reducer(state, { type: "ADD_CELL", newCell: c2, now: NOW });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c1", "c2"]);
    });

    it("inserts after the specified cell", () => {
      const state = makeState([c1, c3]);
      const next = reducer(state, {
        type: "ADD_CELL",
        newCell: c2,
        afterCellId: "c1",
        now: NOW,
      });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    });

    it("appends when afterCellId does not match any cell", () => {
      const state = makeState([c1]);
      const next = reducer(state, {
        type: "ADD_CELL",
        newCell: c2,
        afterCellId: "no-such-cell",
        now: NOW,
      });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c1", "c2"]);
    });

    it("selects the newly added cell", () => {
      const state = makeState([c1], "c1");
      const next = reducer(state, { type: "ADD_CELL", newCell: c2, now: NOW });
      expect(next.ui.selectedCellId).toBe("c2");
    });

    it("updates updatedAt", () => {
      const later = "2025-06-01T00:00:00.000Z";
      const state = makeState([c1]);
      const next = reducer(state, { type: "ADD_CELL", newCell: c2, now: later });
      expect(next.notebook.updatedAt).toBe(later);
    });
  });

  describe("DELETE_CELL", () => {
    it("removes the cell", () => {
      const state = makeState([c1, c2, c3]);
      const next = reducer(state, { type: "DELETE_CELL", cellId: "c2", now: NOW });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c1", "c3"]);
    });

    it("no-ops when cellId not found", () => {
      const state = makeState([c1, c2]);
      const next = reducer(state, { type: "DELETE_CELL", cellId: "nope", now: NOW });
      expect(next).toBe(state);
    });

    it("selects previous cell when selected cell is deleted", () => {
      const state = makeState([c1, c2, c3], "c2");
      const next = reducer(state, { type: "DELETE_CELL", cellId: "c2", now: NOW });
      expect(next.ui.selectedCellId).toBe("c1");
    });

    it("selects next cell when first cell is deleted", () => {
      const state = makeState([c1, c2], "c1");
      const next = reducer(state, { type: "DELETE_CELL", cellId: "c1", now: NOW });
      expect(next.ui.selectedCellId).toBe("c2");
    });

    it("sets selection to null when last cell is deleted", () => {
      const state = makeState([c1], "c1");
      const next = reducer(state, { type: "DELETE_CELL", cellId: "c1", now: NOW });
      expect(next.ui.selectedCellId).toBeNull();
    });

    it("preserves selection when a different cell is deleted", () => {
      const state = makeState([c1, c2, c3], "c1");
      const next = reducer(state, { type: "DELETE_CELL", cellId: "c3", now: NOW });
      expect(next.ui.selectedCellId).toBe("c1");
    });
  });

  describe("UPDATE_CELL_SOURCE", () => {
    it("updates only the matching cell's source", () => {
      const state = makeState([c1, c2]);
      const next = reducer(state, {
        type: "UPDATE_CELL_SOURCE",
        cellId: "c1",
        source: "console.log(1)",
        now: NOW,
      });
      expect((next.notebook.cells[0] as CodeCell).source).toBe("console.log(1)");
      expect((next.notebook.cells[1] as CodeCell).source).toBe("");
    });
  });

  describe("CHANGE_CELL_TYPE", () => {
    it("converts code cell to markdown", () => {
      const state = makeState([makeCodeCell("c1", { source: "# hi" })]);
      const next = reducer(state, {
        type: "CHANGE_CELL_TYPE",
        cellId: "c1",
        newType: "markdown",
        now: NOW,
      });
      expect(next.notebook.cells[0].type).toBe("markdown");
      expect(next.notebook.cells[0].source).toBe("# hi");
    });

    it("converts markdown to code with clean execution state", () => {
      const md = { id: "c1", type: "markdown" as const, source: "hello" };
      const state = makeState([md]);
      const next = reducer(state, {
        type: "CHANGE_CELL_TYPE",
        cellId: "c1",
        newType: "code",
        now: NOW,
      });
      const cell = next.notebook.cells[0] as CodeCell;
      expect(cell.type).toBe("code");
      expect(cell.executionState).toBe("idle");
      expect(cell.executionCount).toBeNull();
    });
  });

  describe("MOVE_CELL", () => {
    it("moves cell up", () => {
      const state = makeState([c1, c2, c3]);
      const next = reducer(state, { type: "MOVE_CELL", cellId: "c2", direction: "up", now: NOW });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c2", "c1", "c3"]);
    });

    it("moves cell down", () => {
      const state = makeState([c1, c2, c3]);
      const next = reducer(state, { type: "MOVE_CELL", cellId: "c2", direction: "down", now: NOW });
      expect(next.notebook.cells.map((c) => c.id)).toEqual(["c1", "c3", "c2"]);
    });

    it("no-ops when already first and moving up", () => {
      const state = makeState([c1, c2]);
      const next = reducer(state, { type: "MOVE_CELL", cellId: "c1", direction: "up", now: NOW });
      expect(next).toBe(state);
    });

    it("no-ops when already last and moving down", () => {
      const state = makeState([c1, c2]);
      const next = reducer(state, { type: "MOVE_CELL", cellId: "c2", direction: "down", now: NOW });
      expect(next).toBe(state);
    });
  });

  describe("SELECT_CELL", () => {
    it("sets selectedCellId", () => {
      const state = makeState([c1, c2], null);
      const next = reducer(state, { type: "SELECT_CELL", cellId: "c2" });
      expect(next.ui.selectedCellId).toBe("c2");
    });

    it("accepts null to clear selection", () => {
      const state = makeState([c1], "c1");
      const next = reducer(state, { type: "SELECT_CELL", cellId: null });
      expect(next.ui.selectedCellId).toBeNull();
    });
  });

  describe("START_EXECUTION", () => {
    it("sets executionState to running and clears output", () => {
      const cell = makeCodeCell("c1", {
        output: { type: "stream", stream: "stdout", text: "old output" },
        executionState: "idle",
      });
      const state = makeState([cell]);
      const next = reducer(state, { type: "START_EXECUTION", cellId: "c1", now: NOW });
      const updated = next.notebook.cells[0] as CodeCell;
      expect(updated.executionState).toBe("running");
      expect((updated.output as StreamOutput).text).toBe("");
    });
  });

  describe("FINISH_EXECUTION", () => {
    it("sets output and executionCount on success", () => {
      const state = makeState([makeCodeCell("c1", { executionState: "running" })]);
      const output = { type: "stream" as const, stream: "stdout" as const, text: "hello\n" };
      const next = reducer(state, {
        type: "FINISH_EXECUTION",
        cellId: "c1",
        output,
        executionCount: 3,
        status: "ok",
        now: NOW,
      });
      const cell = next.notebook.cells[0] as CodeCell;
      expect(cell.executionState).toBe("idle");
      expect(cell.executionCount).toBe(3);
      expect(cell.output).toEqual(output);
      expect(cell.metadata?.collapsed).toBe(false);
    });

    it("sets executionState to error on failure", () => {
      const state = makeState([makeCodeCell("c1", { executionState: "running" })]);
      const next = reducer(state, {
        type: "FINISH_EXECUTION",
        cellId: "c1",
        output: { type: "error", ename: "ReferenceError", evalue: "x is not defined", traceback: [] },
        executionCount: 0,
        status: "error",
        now: NOW,
      });
      const cell = next.notebook.cells[0] as CodeCell;
      expect(cell.executionState).toBe("error");
    });
  });

  describe("QUEUE_CELL", () => {
    it("sets executionState to queued and clears output", () => {
      const state = makeState([makeCodeCell("c1", { executionState: "idle" })]);
      const next = reducer(state, { type: "QUEUE_CELL", cellId: "c1", now: NOW });
      const cell = next.notebook.cells[0] as CodeCell;
      expect(cell.executionState).toBe("queued");
      expect((cell.output as StreamOutput).text).toBe("");
    });
  });

  describe("RESTART_KERNEL", () => {
    it("resets all code cells to idle with no output", () => {
      const cells: Cell[] = [
        makeCodeCell("c1", { executionCount: 5, executionState: "running" }),
        makeCodeCell("c2", { executionCount: 3, executionState: "error" }),
        { id: "m1", type: "markdown", source: "# kept" },
      ];
      const state = makeState(cells);
      const next = reducer(state, { type: "RESTART_KERNEL", now: NOW });
      const code1 = next.notebook.cells[0] as CodeCell;
      const code2 = next.notebook.cells[1] as CodeCell;
      expect(code1.executionCount).toBeNull();
      expect(code1.executionState).toBe("idle");
      expect(code2.executionCount).toBeNull();
      expect(code2.executionState).toBe("idle");
      expect(next.notebook.cells[2].type).toBe("markdown");
    });
  });

  describe("TOGGLE_OUTPUT_COLLAPSED", () => {
    it("toggles collapsed from false to true", () => {
      const state = makeState([makeCodeCell("c1", { metadata: { collapsed: false } })]);
      const next = reducer(state, { type: "TOGGLE_OUTPUT_COLLAPSED", cellId: "c1", now: NOW });
      expect((next.notebook.cells[0] as CodeCell).metadata?.collapsed).toBe(true);
    });

    it("toggles collapsed from true to false", () => {
      const state = makeState([makeCodeCell("c1", { metadata: { collapsed: true } })]);
      const next = reducer(state, { type: "TOGGLE_OUTPUT_COLLAPSED", cellId: "c1", now: NOW });
      expect((next.notebook.cells[0] as CodeCell).metadata?.collapsed).toBe(false);
    });
  });

  describe("UPDATE_TITLE", () => {
    it("updates the notebook title", () => {
      const state = makeState([]);
      const next = reducer(state, { type: "UPDATE_TITLE", title: "New Title", now: NOW });
      expect(next.notebook.metadata.title).toBe("New Title");
    });

    it("does not change cells", () => {
      const state = makeState([c1]);
      const next = reducer(state, { type: "UPDATE_TITLE", title: "X", now: NOW });
      expect(next.notebook.cells).toBe(state.notebook.cells);
    });
  });
});
