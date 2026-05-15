import { apiClient } from "../../../shared/api/apiClient";
import type { NotebookShell } from "../model/types";

const useMockNotebook = true;

const mockNotebookShell: NotebookShell = {
  id: "notebook-demo",
  title: "JS Notebook",
  language: "JavaScript",
  kernelStatus: "ready",
  cells: [
    {
      id: "cell-intro",
      type: "markdown",
      title: "Intro",
      preview: "A small notebook shell loaded through Redux."
    },
    {
      id: "cell-code",
      type: "code",
      title: "First code cell",
      preview: 'console.log("Hello from a mocked JavaScript cell")'
    }
  ]
};

export const notebookService = {
  async getNotebook(): Promise<NotebookShell> {
    if (useMockNotebook) {
      return new Promise((resolve) => {
        window.setTimeout(() => resolve(mockNotebookShell), 250);
      });
    }

    return apiClient.get<NotebookShell>("/notebook");
  }
};
