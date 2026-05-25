import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { notebookService } from "../api/notebookService";
import type { Notebook, NotebookRequestStatus, NotebookShell } from "../model/types";
import { mockNotebook, NotebookProvider } from "../model/notebookContext";
import { NotebookView } from "./NotebookView";

export function NotebookPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();

  const [notebooks, setNotebooks] = useState<NotebookShell[]>([]);
  const [listStatus, setListStatus] = useState<NotebookRequestStatus>("loading");
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  const [notebookStatus, setNotebookStatus] = useState<NotebookRequestStatus>(
    notebookId ? "loading" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Capture the initial URL param so the mount effect doesn't need notebookId as a dep.
  const initialNotebookId = useRef(notebookId);

  // Load the notebook list once on mount.
  // If no notebooks exist yet, create one automatically and land on it.
  // If notebooks exist but no ID is in the URL, redirect to the first one.
  useEffect(() => {
    notebookService.getAllNotebooks()
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
          if (!initialNotebookId.current) {
            navigate(`/${list[0].id}`, { replace: true });
          }
        }
      })
      .catch((err: unknown) => {
        setListStatus("failed");
        setError(err instanceof Error ? err.message : "Failed to load notebooks");
      });
  }, [navigate]);

  // Load notebook content whenever the URL param changes.
  useEffect(() => {
    if (!notebookId) return;
    setNotebookStatus("loading");
    setError(null);
    notebookService.getNotebookById(notebookId)
      .then((nb) => {
        setCurrentNotebook(nb);
        setNotebookStatus("succeeded");
      })
      .catch((err: unknown) => {
        setNotebookStatus("failed");
        setError(err instanceof Error ? err.message : "Failed to load notebook");
      });
  }, [notebookId]);

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

  const handleDeleteNotebook = async () => {
    if (!notebookId) return;
    await notebookService.deleteNotebook(notebookId);
    let list = await notebookService.getAllNotebooks();
    if (list.length === 0) {
      const nb = await notebookService.createNotebook();
      list = await notebookService.getAllNotebooks();
      navigate(`/${nb.id}`, { replace: true });
    } else {
      navigate(`/${list[0].id}`, { replace: true });
    }
    setNotebooks(list);
  };

  const resolvedNotebook = currentNotebook ?? mockNotebook;

  return (
    <NotebookProvider
      key={currentNotebook?.id ?? "empty"}
      initialNotebook={resolvedNotebook}
      initialSelectedCellId={resolvedNotebook.cells[0]?.id ?? null}
    >
      <NotebookView
        notebooks={notebooks}
        listStatus={listStatus}
        selectedId={notebookId ?? null}
        onSelectNotebook={handleSelectNotebook}
        onCreateNotebook={handleCreateNotebook}
        isCreating={isCreating}
        onDeleteNotebook={handleDeleteNotebook}
        onTitleSaved={(id, title) =>
          setNotebooks((prev) => prev.map((nb) => nb.id === id ? { ...nb, title } : nb))
        }
        notebookStatus={notebookStatus}
        error={error}
      />
    </NotebookProvider>
  );
}
