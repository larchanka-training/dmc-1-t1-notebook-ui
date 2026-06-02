import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../auth/model/authContext";
import { AuthModal } from "../../auth/ui/AuthModal";
import { notebookService } from "../api/notebookService";
import { mockNotebook, NotebookProvider } from "../model/notebookContext";
import type { Notebook, NotebookRequestStatus, NotebookShell } from "../model/types";
import { NotebookSidebar } from "./NotebookSidebar";
import { NotebookView } from "./NotebookView";
import { UnauthenticatedPlaceholder } from "./UnauthenticatedPlaceholder";

export function NotebookPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [notebooks, setNotebooks] = useState<NotebookShell[]>([]);
  const [listStatus, setListStatus] = useState<NotebookRequestStatus>("idle");
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const [notebookStatus, setNotebookStatus] = useState<NotebookRequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [titleSync, setTitleSync] = useState<{ id: string; title: string } | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadTriggeredForStatus = useRef<string | null>(null);

  // Load notebooks when authenticated. Re-runs on login/logout.
  useEffect(() => {
    if (auth.status !== "authenticated") {
      if (auth.status === "unauthenticated") {
        setNotebooks([]);
        setCurrentNotebook(null);
        setListStatus("idle");
        setNotebookStatus("idle");
        loadTriggeredForStatus.current = null;
      }
      return;
    }

    // Avoid double-loading (React StrictMode fires effects twice in dev)
    if (loadTriggeredForStatus.current === "authenticated") return;
    loadTriggeredForStatus.current = "authenticated";

    setListStatus("loading");
    notebookService
      .getAllNotebooks()
      .then(async (list) => {
        if (list.length === 0) {
          const nb = await notebookService.createNotebook();
          const fresh = await notebookService.getAllNotebooks();
          setNotebooks(fresh);
          setListStatus("succeeded");
          navigate(`/${nb.id}`, { replace: true });
        } else {
          setNotebooks(list);
          setListStatus("succeeded");
          // Always navigate to the most recent notebook on login
          navigate(`/${list[0].id}`, { replace: true });
        }
      })
      .catch((err: unknown) => {
        setListStatus("failed");
        setError(err instanceof Error ? err.message : "Failed to load notebooks");
      });
  }, [auth.status, navigate]);

  // Load notebook content whenever the URL param changes.
  useEffect(() => {
    if (!notebookId || auth.status !== "authenticated") return;
    setNotebookStatus("loading");
    setError(null);
    notebookService
      .getNotebookById(notebookId)
      .then((nb) => {
        setCurrentNotebook(nb);
        setNotebookStatus("succeeded");
      })
      .catch((err: unknown) => {
        setNotebookStatus("failed");
        setError(err instanceof Error ? err.message : "Failed to load notebook");
      });
  }, [notebookId, auth.status]);

  const handleSelectNotebook = (id: string) => navigate(`/${id}`);

  const handleCreateNotebook = async () => {
    setIsCreating(true);
    try {
      const nb = await notebookService.createNotebook();
      const list = await notebookService.getAllNotebooks();
      setNotebooks(list);
      navigate(`/${nb.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create notebook");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    await notebookService.deleteNotebook(id);
    let list = await notebookService.getAllNotebooks();
    if (list.length === 0) {
      const nb = await notebookService.createNotebook();
      list = await notebookService.getAllNotebooks();
      navigate(`/${nb.id}`, { replace: true });
    } else if (id === notebookId) {
      navigate(`/${list[0].id}`, { replace: true });
    }
    setNotebooks(list);
  };

  const handleRenameNotebook = async (id: string, title: string) => {
    const full =
      id === notebookId && currentNotebook
        ? currentNotebook
        : await notebookService.getNotebookById(id);
    const updated: Notebook = { ...full, metadata: { ...full.metadata, title } };
    await notebookService.saveNotebook(updated);
    setNotebooks((prev) => prev.map((nb) => (nb.id === id ? { ...nb, title } : nb)));
    if (id === notebookId) {
      setCurrentNotebook(updated);
      setTitleSync({ id, title });
    }
  };

  const resolvedNotebook = currentNotebook ?? mockNotebook;

  // ---- Auth loading splash ----
  if (auth.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-stone-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <NotebookSidebar
        notebooks={notebooks}
        listStatus={listStatus}
        selectedId={notebookId ?? null}
        onSelectNotebook={handleSelectNotebook}
        onCreateNotebook={handleCreateNotebook}
        isCreating={isCreating}
        onDeleteNotebook={handleDeleteNotebook}
        onRenameNotebook={handleRenameNotebook}
        user={auth.user}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={auth.logout}
      />

      {auth.status === "unauthenticated" ? (
        <UnauthenticatedPlaceholder onOpenAuthModal={() => setShowAuthModal(true)} />
      ) : (
        <NotebookProvider
          key={currentNotebook?.id ?? "empty"}
          initialNotebook={resolvedNotebook}
          initialSelectedCellId={resolvedNotebook.cells[0]?.id ?? null}
        >
          <NotebookView
            notebookStatus={notebookStatus}
            error={error}
            titleSync={titleSync}
          />
        </NotebookProvider>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
