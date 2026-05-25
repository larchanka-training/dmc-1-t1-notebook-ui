import { createAsyncThunk } from "@reduxjs/toolkit";

import { notebookService } from "../api/notebookService";
import type { NotebookShell } from "./types";

export const fetchNotebook = createAsyncThunk<
  NotebookShell,
  string,
  { rejectValue: string }
>("notebook/fetchNotebook", async (id, { rejectWithValue }) => {
  try {
    return await notebookService.getNotebook(id);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load notebook"
    );
  }
});
