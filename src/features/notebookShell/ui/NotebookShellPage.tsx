import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../../app/store/hooks";
import {
  selectNotebookShell,
  selectNotebookShellError,
  selectNotebookShellStatus
} from "../model/selectors";
import { fetchNotebookShell } from "../model/notebookShellThunks";
import { NotebookShellView } from "./NotebookShellView";

export function NotebookShellPage() {
  const dispatch = useAppDispatch();
  const notebook = useAppSelector(selectNotebookShell);
  const status = useAppSelector(selectNotebookShellStatus);
  const error = useAppSelector(selectNotebookShellError);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchNotebookShell());
    }
  }, [dispatch, status]);

  return (
    <NotebookShellView notebook={notebook} status={status} error={error} />
  );
}
