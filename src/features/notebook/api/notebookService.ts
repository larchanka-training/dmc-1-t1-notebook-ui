import { apiClient } from "../../../shared/api/apiClient";
import { randomUUID } from "../../../shared/lib/uuid";
import type { Notebook, NotebookShell } from "../model/types";

const USE_MOCK = true;
const STORAGE_KEY = "dmc:notebooks";
const MOCK_DELAY_MS = 250;

// ---- localStorage helpers ----

function readStore(): Record<string, Notebook> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Notebook>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// ---- Notebook → NotebookShell projection ----

function toShell(notebook: Notebook): NotebookShell {
  return {
    id: notebook.id,
    title: notebook.metadata.title,
    language: (notebook.metadata.custom?.language as string) ?? "JavaScript",
    kernelStatus: "idle",
    cells: notebook.cells
      .filter((c) => c.type !== "raw")
      .map((cell) => {
        const firstLine = cell.source.split("\n")[0];
        const title = firstLine.replace(/^#+\s*/, "").slice(0, 60) || cell.id;
        const preview = cell.source.slice(0, 120);
        return {
          id: cell.id,
          type: cell.type as "markdown" | "code",
          title,
          preview,
        };
      }),
  };
}

// ---- Service ----

const mockService = {
  async getAllNotebooks(): Promise<NotebookShell[]> {
    return delay(Object.values(readStore()).map(toShell).reverse());
  },

  async getNotebook(id: string): Promise<NotebookShell> {
    const notebook = readStore()[id];
    if (!notebook) throw new Error(`Notebook "${id}" not found`);
    return delay(toShell(notebook));
  },

  async getNotebookById(id: string): Promise<Notebook> {
    const notebook = readStore()[id];
    if (!notebook) throw new Error(`Notebook "${id}" not found`);
    return delay(notebook);
  },

  async saveNotebook(notebook: Notebook, signal?: AbortSignal): Promise<Notebook> {
    const store = readStore();
    const saved: Notebook = { ...notebook, updatedAt: new Date().toISOString() };
    store[saved.id] = saved;
    writeStore(store);
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => resolve(saved), MOCK_DELAY_MS);
      signal?.addEventListener("abort", () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  },

  async createNotebook(title = "Untitled Notebook"): Promise<Notebook> {
    const now = new Date().toISOString();
    const notebook: Notebook = {
      id: `notebook-${randomUUID().slice(0, 8)}`,
      metadata: { title, custom: { language: "JavaScript" } },
      cells: [
        {
          id: randomUUID(),
          type: "code",
          source: "",
          executionCount: null,
          output: { type: "execute_result", text: "" },
          executionState: "idle",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const store = readStore();
    store[notebook.id] = notebook;
    writeStore(store);
    return delay(notebook);
  },

  async deleteNotebook(id: string): Promise<void> {
    const store = readStore();
    delete store[id];
    writeStore(store);
    return new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  },
};

const apiService = {
  async getAllNotebooks(): Promise<NotebookShell[]> {
    return apiClient.get<NotebookShell[]>("/notebooks");
  },

  async getNotebook(id: string): Promise<NotebookShell> {
    return apiClient.get<NotebookShell>(`/notebooks/${id}/shell`);
  },

  async getNotebookById(id: string): Promise<Notebook> {
    return apiClient.get<Notebook>(`/notebooks/${id}`);
  },

  async saveNotebook(notebook: Notebook, _signal?: AbortSignal): Promise<Notebook> {
    return apiClient.get<Notebook>(`/notebooks/${notebook.id}`); // TODO: use PUT + pass signal to fetch
  },

  async createNotebook(_title = "Untitled Notebook"): Promise<Notebook> {
    return apiClient.get<Notebook>("/notebooks");
  },

  async deleteNotebook(id: string): Promise<void> {
    await apiClient.get(`/notebooks/${id}`); // TODO: use DELETE method
  },
};

export const notebookService = USE_MOCK ? mockService : apiService;
