import { type KeyboardEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { User } from "../../auth/api/authService";
import type { NotebookRequestStatus, NotebookShell } from "../model/types";
import { Button } from "../../../shared/ui/Button";

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

interface NotebookSidebarProps {
  notebooks: NotebookShell[];
  listStatus: NotebookRequestStatus;
  selectedId: string | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  isCreating: boolean;
  onDeleteNotebook: (id: string) => Promise<void>;
  onRenameNotebook: (id: string, title: string) => Promise<void>;
  user: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => Promise<void>;
}

export function NotebookSidebar({
  notebooks,
  listStatus,
  selectedId,
  onSelectNotebook,
  onCreateNotebook,
  isCreating,
  onDeleteNotebook,
  onRenameNotebook,
  user,
  onOpenAuthModal,
  onLogout,
}: NotebookSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<NotebookShell | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);
  const renameEscapeRef = useRef(false);

  const isListLoading = listStatus === "loading" || listStatus === "idle";

  // ---- delete ----

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDeleteNotebook(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ---- rename ----

  const startRename = (nb: NotebookShell) => {
    setRenamingId(nb.id);
    setRenameValue(nb.title);
  };

  const commitRename = async () => {
    if (renameEscapeRef.current) {
      renameEscapeRef.current = false;
      setRenamingId(null);
      return;
    }
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    const original = notebooks.find((nb) => nb.id === renamingId)?.title ?? "";
    if (!trimmed || trimmed === original) {
      setRenamingId(null);
      return;
    }
    setIsSavingRename(true);
    try {
      await onRenameNotebook(renamingId, trimmed);
    } finally {
      setRenamingId(null);
      setIsSavingRename(false);
    }
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      renameEscapeRef.current = true;
      e.currentTarget.blur();
    }
  };

  // ---- logout ----

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-stone-50 h-screen">
        {/* Logo / title */}
        <div className="flex items-center gap-2 px-4 py-[15px] border-b border-stone-200">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600 shrink-0">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span className="text-sm font-semibold text-stone-800">Notebook</span>
        </div>

        {/* New notebook — only when signed in */}
        {user && (
          <div className="px-2 pt-2 pb-1">
            <button
              onClick={onCreateNotebook}
              disabled={isCreating}
              className="cursor-pointer flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-sm leading-none font-medium">+</span>
              <span>{isCreating ? "Creating…" : "New notebook"}</span>
            </button>
          </div>
        )}

        {/* Notebooks list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {!user ? (
            <p className="px-2 py-2 text-xs text-stone-400">Sign in to see your notebooks.</p>
          ) : isListLoading ? (
            <p className="px-2 py-1.5 text-xs text-stone-400 animate-pulse">Loading…</p>
          ) : listStatus === "failed" ? (
            <p className="px-2 py-1.5 text-xs text-red-500">Failed to load</p>
          ) : (
            notebooks.map((nb) => (
              <div
                key={nb.id}
                className={`flex items-center rounded px-2 py-1.5 cursor-pointer ${
                  selectedId === nb.id
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                }`}
                onClick={() => renamingId !== nb.id && onSelectNotebook(nb.id)}
                onMouseEnter={() => setHoveredId(nb.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {renamingId === nb.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => void commitRename()}
                    onKeyDown={handleRenameKeyDown}
                    disabled={isSavingRename}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs text-stone-900 outline-none focus:border-stone-500 disabled:opacity-60"
                  />
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm">{nb.title}</span>
                    <div className={`ml-1 flex items-center gap-0.5 transition-opacity ${hoveredId === nb.id ? "opacity-100" : "opacity-0"}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(nb); }}
                        className="cursor-pointer shrink-0 rounded p-0.5 text-stone-400 hover:text-stone-700 transition-colors"
                        title="Rename notebook"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(nb); }}
                        className="cursor-pointer shrink-0 rounded p-0.5 text-stone-400 hover:text-red-500 transition-colors"
                        title="Delete notebook"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom: auth + help */}
        <div className="border-t border-stone-200 px-3 py-3 space-y-0.5">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="truncate text-xs text-stone-600">{user.display_name}</span>
              </div>
              <button
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Sign in
            </button>
          )}
          <Link
            to="/help"
            className="block px-2 py-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Help & documentation
          </Link>
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-900">Delete notebook?</h2>
            <p className="mt-2 text-sm text-stone-500">
              <span className="font-medium text-stone-700">"{deleteTarget.title}"</span>{" "}
              will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
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
    </>
  );
}
