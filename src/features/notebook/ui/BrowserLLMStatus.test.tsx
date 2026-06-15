import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserLLMStatus } from "./BrowserLLMStatus";
import type { WebLLMStatus } from "../model/useWebLLM";

vi.mock("../model/useWebLLM", () => ({
  useWebLLM: vi.fn(),
}));

import { useWebLLM } from "../model/useWebLLM";
const mockUseWebLLM = vi.mocked(useWebLLM);

function renderWithStatus(status: WebLLMStatus, error: string | null = null) {
  mockUseWebLLM.mockReturnValue({ status, error, generate: vi.fn() });
  return render(<BrowserLLMStatus />);
}

describe("BrowserLLMStatus", () => {
  it("shows spinner and 'preparing' while loading", () => {
    const { container } = renderWithStatus("preparing");
    expect(screen.getByText(/Browser LLM/)).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows green dot and 'ready' when engine is ready", () => {
    const { container } = renderWithStatus("ready");
    expect(screen.getByText(/Browser LLM/)).toBeInTheDocument();
    expect(container.querySelector(".bg-green-400")).toBeInTheDocument();
  });

  it("shows red dot and underlined 'error' when engine failed", () => {
    const { container } = renderWithStatus("error", "WebGPU not supported");
    expect(container.querySelector(".bg-red-400")).toBeInTheDocument();
    const errorSpan = screen.getByText("error");
    expect(errorSpan).toHaveClass("underline");
  });

  it("shows error message as tooltip on the 'error' word", () => {
    renderWithStatus("error", "WebGPU not supported");
    const errorSpan = screen.getByText("error");
    expect(errorSpan).toHaveAttribute("title", "WebGPU not supported");
  });

  it("shows no dot element when preparing", () => {
    const { container } = renderWithStatus("preparing");
    expect(container.querySelector(".bg-green-400")).not.toBeInTheDocument();
    expect(container.querySelector(".bg-red-400")).not.toBeInTheDocument();
  });
});
