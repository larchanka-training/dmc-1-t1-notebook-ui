import { createSlice } from "@reduxjs/toolkit";

import { fetchNotebookShell } from "./notebookShellThunks";
import type { NotebookShellState } from "./types";

const initialState: NotebookShellState = {
  notebook: null,
  status: "idle",
  error: null
};

const notebookShellSlice = createSlice({
  name: "notebookShell",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotebookShell.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotebookShell.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notebook = action.payload;
      })
      .addCase(fetchNotebookShell.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load notebook shell";
      });
  }
});

export default notebookShellSlice.reducer;
