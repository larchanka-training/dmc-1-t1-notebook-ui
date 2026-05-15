import { createAsyncThunk } from "@reduxjs/toolkit";

import { notebookService } from "../api/notebookService";
import type { NotebookShell } from "./types";

export const fetchNotebook = createAsyncThunk<
  NotebookShell,
  void,
  { rejectValue: string }
>("notebook/fetchNotebook", async (_, { rejectWithValue }) => {
  try {
    return await notebookService.getNotebook();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to load notebook"
    );
  }
});
