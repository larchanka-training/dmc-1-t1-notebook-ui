import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../../app/store/hooks";
import {
  selectNotebook,
  selectNotebookError,
  selectNotebookStatus
} from "../model/selectors";
import { fetchNotebook } from "../model/notebookThunks";
import { NotebookView } from "./NotebookView";
import { mockNotebook, NotebookProvider } from "../model/notebookContext";

export function NotebookPage() {
  const dispatch = useAppDispatch();
  const notebook = useAppSelector(selectNotebook);
  const status = useAppSelector(selectNotebookStatus);
  const error = useAppSelector(selectNotebookError);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchNotebook());
    }
  }, [dispatch, status]);

  return (
    <NotebookProvider
      initialNotebook={mockNotebook}
      initialSelectedCellId={mockNotebook.cells[0]?.id ?? null}
    >
      <NotebookView notebook={notebook} status={status} error={error} />
    </NotebookProvider>
  );
}
