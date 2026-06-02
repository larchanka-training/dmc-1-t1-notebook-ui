import { useEffect, useRef } from "react";
import { notebookService } from "../api/notebookService";
import { AUTOSAVE_DEBOUNCE_MS } from "../config";
import type { Cell, Notebook } from "./types";

// Serialise only the fields the backend persists. Runtime fields (output, executionCount,
// executionState) are intentionally excluded so execution alone never triggers a save.
function saveableKey(cells: Cell[]): string {
  return JSON.stringify(
    cells.map(({ id, type, source, metadata }) => ({ id, type, source, metadata }))
  );
}

export function useAutoSave(notebook: Notebook) {
  // Always holds the latest notebook so the debounced callback never closes over stale data.
  const latestNotebook = useRef(notebook);
  latestNotebook.current = notebook;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // O(1) guard: skip the initial mount and React StrictMode's simulated double-mount
  // (both see the same cells reference, since no user action has happened yet).
  const mountCellsRef = useRef(notebook.cells);

  // O(n) guard: skip when only runtime fields changed (output, executionCount, executionState).
  // Initialised at mount so the first real edit is always detected correctly.
  const lastSavedKeyRef = useRef(saveableKey(notebook.cells));

  // Trigger on every cells reference change (any cell edit, add, delete, move, type change).
  // Title edits do not change notebook.cells, so they don't trigger this.
  useEffect(() => {
    if (notebook.cells === mountCellsRef.current) return;

    const key = saveableKey(notebook.cells);
    if (key === lastSavedKeyRef.current) return;
    lastSavedKeyRef.current = key;

    // Reset the debounce window.
    if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      // Abort any in-flight save and replace it with a fresh request.
      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;

      try {
        await notebookService.saveNotebook(latestNotebook.current, controller.signal);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("Auto-save failed:", e);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [notebook.cells]);

  // Cancel pending work when the component (or provider) unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
      abortController.current?.abort();
    };
  }, []);
}
