import { describe, it, expect } from "vitest";
import {
  selectNotebook,
  selectNotebookStatus,
  selectNotebookError,
} from "./selectors";
import type { RootState } from "../../../app/store/store";
import type { NotebookShell } from "./types";

function makeState(
  overrides: Partial<{
    notebook: NotebookShell | null;
    status: string;
    error: string | null;
  }> = {}
): RootState {
  return {
    notebook: {
      notebook: null,
      status: "idle",
      error: null,
      ...overrides,
    },
  } as unknown as RootState;
}

const stubNotebook: NotebookShell = {
  id: "nb-1",
  title: "My Notebook",
  language: "javascript",
  kernelStatus: "ready",
  cells: [],
};

describe("selectors", () => {
  describe("selectNotebook", () => {
    it("returns null when no notebook is loaded", () => {
      expect(selectNotebook(makeState())).toBeNull();
    });

    it("returns the notebook when present", () => {
      expect(
        selectNotebook(makeState({ notebook: stubNotebook }))
      ).toEqual(stubNotebook);
    });
  });

  describe("selectNotebookStatus", () => {
    it("returns idle by default", () => {
      expect(selectNotebookStatus(makeState())).toBe("idle");
    });

    it("returns loading when fetching", () => {
      expect(selectNotebookStatus(makeState({ status: "loading" }))).toBe(
        "loading"
      );
    });

    it("returns succeeded after successful fetch", () => {
      expect(selectNotebookStatus(makeState({ status: "succeeded" }))).toBe(
        "succeeded"
      );
    });

    it("returns failed after a fetch error", () => {
      expect(selectNotebookStatus(makeState({ status: "failed" }))).toBe(
        "failed"
      );
    });
  });

  describe("selectNotebookError", () => {
    it("returns null when there is no error", () => {
      expect(selectNotebookError(makeState())).toBeNull();
    });

    it("returns the error message when present", () => {
      expect(
        selectNotebookError(makeState({ error: "Network error" }))
      ).toBe("Network error");
    });
  });
});
