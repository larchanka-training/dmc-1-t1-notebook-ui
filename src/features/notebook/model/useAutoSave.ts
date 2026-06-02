import { useEffect, useRef } from "react";
import { notebookService } from "../api/notebookService";
import { AUTOSAVE_DEBOUNCE_MS } from "../config";
import type { Notebook } from "./types";

export function useAutoSave(notebook: Notebook) {
  // Always holds the latest notebook so the debounced callback never closes over stale data.
  const latestNotebook = useRef(notebook);
  latestNotebook.current = notebook;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Capture the cells reference at mount time. The reducer always creates a new array on
  // any mutation, so reference equality means "no user edit yet". This correctly skips the
  // initial effect run AND React StrictMode's simulated double-mount (both see the same
  // reference), while still firing for every real user change.
  const mountCellsRef = useRef(notebook.cells);

  // Trigger on every cells reference change (any cell edit, add, delete, move, type change).
  // Title edits do not change notebook.cells, so they don't trigger this.
  useEffect(() => {
    if (notebook.cells === mountCellsRef.current) return;

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
