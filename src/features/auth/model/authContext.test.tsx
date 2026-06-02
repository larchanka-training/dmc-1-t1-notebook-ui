import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./authContext";
import * as authService from "../api/authService";

vi.mock("../api/authService", () => ({
  authService: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService.authService);

function StatusDisplay() {
  const { status, user, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button onClick={() => login("a@b.com", "pass")}>login</button>
      <button onClick={() => register("a@b.com", "pass", "Alice")}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <StatusDisplay />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("starts in loading state", () => {
    mockAuthService.getMe.mockReturnValue(new Promise(() => {})); // never resolves
    renderProvider();
    expect(screen.getByTestId("status").textContent).toBe("loading");
  });

  it("becomes authenticated when getMe succeeds", async () => {
    mockAuthService.getMe.mockResolvedValue({ id: "u1", email: "a@b.com", displayName: "Alice" });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated")
    );
    expect(screen.getByTestId("user").textContent).toBe("a@b.com");
  });

  it("becomes unauthenticated when getMe fails", async () => {
    mockAuthService.getMe.mockRejectedValue(new Error("401"));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated")
    );
  });

  it("login sets user and authenticated status", async () => {
    mockAuthService.getMe.mockRejectedValue(new Error("no session"));
    mockAuthService.login.mockResolvedValue({ id: "u2", email: "a@b.com", displayName: "Alice" });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("unauthenticated"));

    await userEvent.click(screen.getByText("login"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated")
    );
    expect(screen.getByTestId("user").textContent).toBe("a@b.com");
  });

  it("register sets user and authenticated status", async () => {
    mockAuthService.getMe.mockRejectedValue(new Error("no session"));
    mockAuthService.register.mockResolvedValue({ id: "u3", email: "a@b.com", displayName: "Alice" });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("unauthenticated"));

    await userEvent.click(screen.getByText("register"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("authenticated")
    );
  });

  it("logout clears user and sets unauthenticated", async () => {
    mockAuthService.getMe.mockResolvedValue({ id: "u1", email: "a@b.com", displayName: "Alice" });
    mockAuthService.logout.mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));

    await userEvent.click(screen.getByText("logout"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated")
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("clears auth state when auth:session-expired event fires", async () => {
    mockAuthService.getMe.mockResolvedValue({ id: "u1", email: "a@b.com", displayName: "Alice" });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("authenticated"));

    act(() => {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated")
    );
  });
});
