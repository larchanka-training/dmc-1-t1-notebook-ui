import React, { useRef, useState } from "react";
import type { NotebookRequestStatus, NotebookShell } from "../model/types";
import { NotebookToolbar } from "./NotebookToolbar";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { useAutoSave } from "../model/useAutoSave";
import { notebookService } from "../api/notebookService";
import { NotebookCell } from "./NotebookCell";
import { Button } from "../../../shared/ui/Button";

// ---- Icons ----

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ---- Component ----

interface NotebookViewProps {
  notebooks: NotebookShell[];
  listStatus: NotebookRequestStatus;
  selectedId: string | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  isCreating: boolean;
  onDeleteNotebook: () => Promise<void>;
  onTitleSaved: (id: string, title: string) => void;
  notebookStatus: NotebookRequestStatus;
  error: string | null;
}

export function NotebookView({
  notebooks,
  listStatus,
  selectedId,
  onSelectNotebook,
  onCreateNotebook,
  isCreating,
  onDeleteNotebook,
  onTitleSaved,
  notebookStatus,
  error,
}: NotebookViewProps) {
  const { state, dispatch } = useNotebook();
  const { cells } = state.notebook;

  useAutoSave(state.notebook);

  // ---- delete modal state ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- title edit state ----
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const escapeRef = useRef(false);

  const isListLoading = listStatus === "loading" || listStatus === "idle";
  const isNotebookLoading = notebookStatus === "loading" || notebookStatus === "idle";
  const isAnyLoading = isListLoading || isNotebookLoading || isCreating;

  // ---- handlers ----

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteNotebook();
    } catch {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleTitleBlur = async () => {
    if (escapeRef.current) {
      escapeRef.current = false;
      return;
    }
    if (editTitle === null) return;
    const trimmed = editTitle.trim();
    const current = state.notebook.metadata.title;
    if (!trimmed || trimmed === current) {
      setEditTitle(null);
      return;
    }
    setIsSavingTitle(true);
    try {
      const updated = {
        ...state.notebook,
        metadata: { ...state.notebook.metadata, title: trimmed },
      };
      await notebookService.saveNotebook(updated);
      dispatch(notebookActions.updateTitle(trimmed));
      if (selectedId) onTitleSaved(selectedId, trimmed);
    } finally {
      setEditTitle(null);
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      escapeRef.current = true;
      setEditTitle(null);
    }
  };

  // ---- render ----

  return (
    <main className="mx-auto flex h-screen w-full max-w-5xl flex-col px-4 py-4 text-stone-800 sm:px-6 lg:px-8 flex-1">
      <section className="mb-4 flex flex-col gap-4 border-b border-stone-200 pb-2 sm:flex-row sm:items-start sm:justify-between">

        {/* Title area */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
            Notebook
          </p>
          {isNotebookLoading ? (
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="animate-pulse text-stone-400">Loading…</span>
            </h1>
          ) : editTitle !== null ? (
            <div className="flex items-center gap-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => void handleTitleBlur()}
                onKeyDown={handleTitleKeyDown}
                disabled={isSavingTitle}
                autoFocus
                className="text-2xl font-semibold tracking-tight text-stone-900 border-b-2 border-stone-400 bg-transparent outline-none focus:border-stone-700 disabled:opacity-60 min-w-0 w-72"
              />
              {isSavingTitle && (
                <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600" />
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                {state.notebook.metadata.title}
              </h1>
              <button
                onClick={() => setEditTitle(state.notebook.metadata.title)}
                className="pt-2.5 text-stone-400 hover:text-stone-600 rounded p-0.5 transition-colors"
                title="Rename notebook"
              >
                <PencilIcon />
              </button>
            </div>
          )}
        </div>

        {/* Toolbar area */}
        <div className="flex gap-2 items-center mt-1 sm:mt-6">
          <select
            disabled={isListLoading}
            value={selectedId ?? ""}
            onChange={(e) => onSelectNotebook(e.target.value)}
            className="w-56 rounded border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-600 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isListLoading ? (
              <option value="">Loading notebooks…</option>
            ) : listStatus === "failed" ? (
              <option value="">Failed to load</option>
            ) : (
              notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>{nb.title}</option>
              ))
            )}
          </select>

          <Button
            onClick={onCreateNotebook}
            disabled={isCreating}
            className="bg-white border border-stone-200"
            title="Create new notebook"
          >
            {isCreating ? "…" : "+"}
          </Button>

          <Button
            onClick={() => setShowDeleteModal(true)}
            disabled={isAnyLoading || !selectedId}
            className="h-8.5 bg-white border border-stone-200 text-red-500 hover:border-red-200 disabled:text-stone-400"
            title="Delete notebook"
          >
            <TrashIcon />
          </Button>
        </div>
      </section>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col flex-1 min-h-0 rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-stone-200 px-4 py-2">
          <NotebookToolbar />
        </div>

        {isNotebookLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading notebook…</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 flex-1 overflow-scroll">
            <div className="flex flex-col gap-4">
              {cells.map((cell, index) => (
                <NotebookCell key={cell.id} cell={cell} index={index} total={cells.length} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-900">Delete notebook?</h2>
            <p className="mt-2 text-sm text-stone-500">
              <span className="font-medium text-stone-700">
                "{state.notebook.metadata.title}"
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-white" />
                    Deleting…
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
