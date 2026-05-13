import { createAsyncThunk } from "@reduxjs/toolkit";

import { notebookShellService } from "../api/notebookShellService";
import type { NotebookShell } from "./types";

export const fetchNotebookShell = createAsyncThunk<
  NotebookShell,
  void,
  { rejectValue: string }
>("notebookShell/fetchNotebookShell", async (_, { rejectWithValue }) => {
  try {
    return await notebookShellService.getNotebookShell();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load notebook shell"
    );
  }
});
