import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserLLMStatus } from "./BrowserLLMStatus";
import type { WebLLMStatus } from "../model/useWebLLM";

vi.mock("../model/useWebLLM", () => ({
  useWebLLM: vi.fn(),
}));

import { useWebLLM } from "../model/useWebLLM";
const mockUseWebLLM = vi.mocked(useWebLLM);

function renderWithStatus(status: WebLLMStatus) {
  mockUseWebLLM.mockReturnValue({ status, generate: vi.fn() });
  return render(<BrowserLLMStatus />);
}

describe("BrowserLLMStatus", () => {
  it("shows spinner and 'preparing' while loading", () => {
    renderWithStatus("preparing");
    expect(screen.getByText(/Browser LLM · preparing/)).toBeInTheDocument();
    // spinner is the animated element — no dot
    const { container } = render(<BrowserLLMStatus />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows green dot and 'ready' when engine is ready", () => {
    const { container } = renderWithStatus("ready");
    expect(screen.getByText(/Browser LLM · ready/)).toBeInTheDocument();
    const dot = container.querySelector(".bg-green-400");
    expect(dot).toBeInTheDocument();
  });

  it("shows red dot and 'error' when engine failed", () => {
    const { container } = renderWithStatus("error");
    expect(screen.getByText(/Browser LLM · error/)).toBeInTheDocument();
    const dot = container.querySelector(".bg-red-400");
    expect(dot).toBeInTheDocument();
  });

  it("shows no dot element when preparing", () => {
    const { container } = renderWithStatus("preparing");
    expect(container.querySelector(".bg-green-400")).not.toBeInTheDocument();
    expect(container.querySelector(".bg-red-400")).not.toBeInTheDocument();
  });
});
