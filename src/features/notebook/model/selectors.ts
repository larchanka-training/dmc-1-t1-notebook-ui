import type { RootState } from "../../../app/store/store";

export const selectNotebook = (state: RootState) =>
  state.notebook.notebook;

export const selectNotebookStatus = (state: RootState) =>
  state.notebook.status;

export const selectNotebookError = (state: RootState) =>
  state.notebook.error;
