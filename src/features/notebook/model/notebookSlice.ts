import { createSlice } from "@reduxjs/toolkit";

import { fetchNotebook } from "./notebookThunks";
import type { NotebookShellState } from "./types";

const initialState: NotebookShellState = {
  notebook: null,
  status: "idle",
  error: null
};

const notebookSlice = createSlice({
  name: "notebook",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotebook.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotebook.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notebook = action.payload;
      })
      .addCase(fetchNotebook.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load notebook";
      });
  }
});

export default notebookSlice.reducer;
