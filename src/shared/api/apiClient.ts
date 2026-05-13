const API_BASE_PATH = "/api/v1";

async function get<T>(path: string): Promise<T> {
  const response = await window.fetch(`${API_BASE_PATH}${path}`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get
};
