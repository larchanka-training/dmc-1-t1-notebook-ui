import { apiClient } from "../../../shared/api/apiClient";

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export const authService = {
  login(email: string, password: string): Promise<User> {
    return apiClient.post<User>("/auth/login", { email, password });
  },

  register(email: string, password: string, display_name?: string): Promise<User> {
    return apiClient.post<User>("/auth/register", { email, password, display_name });
  },

  logout(): Promise<void> {
    return apiClient.post<void>("/auth/logout");
  },

  getMe(signal?: AbortSignal): Promise<User> {
    return apiClient.get<User>("/auth/me", signal);
  },
};
