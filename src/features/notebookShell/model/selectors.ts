import type { RootState } from "../../../app/store/store";

export const selectNotebookShell = (state: RootState) =>
  state.notebookShell.notebook;

export const selectNotebookShellStatus = (state: RootState) =>
  state.notebookShell.status;

export const selectNotebookShellError = (state: RootState) =>
  state.notebookShell.error;
