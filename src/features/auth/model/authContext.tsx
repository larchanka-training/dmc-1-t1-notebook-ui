/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

import { authService, type User } from "../api/authService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

type AuthAction =
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" };

function reducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { user: action.payload, status: "authenticated" };
    case "CLEAR_USER":
      return { user: null, status: "unauthenticated" };
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { user: null, status: "loading" });

  // Clear auth state whenever apiClient fires this event (refresh token expired).
  useEffect(() => {
    const onExpired = () => dispatch({ type: "CLEAR_USER" });
    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    authService
      .getMe(controller.signal)
      .then((user) => dispatch({ type: "SET_USER", payload: user }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        dispatch({ type: "CLEAR_USER" });
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await authService.login(email, password);
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const user = await authService.register(email, password, displayName);
      dispatch({ type: "SET_USER", payload: user });
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch({ type: "CLEAR_USER" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
