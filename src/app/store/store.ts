import { configureStore } from "@reduxjs/toolkit";

import notebookShellReducer from "../../features/notebookShell/model/notebookShellSlice";

export const store = configureStore({
  reducer: {
    notebookShell: notebookShellReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
