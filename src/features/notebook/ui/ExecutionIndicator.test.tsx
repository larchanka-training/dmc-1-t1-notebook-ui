import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutionIndicator } from "./ExecutionIndicator";
import type { CodeCell } from "../model/types";

function makeCell(overrides: Partial<CodeCell>): CodeCell {
  return {
    id: "c1",
    type: "code",
    source: "",
    executionCount: null,
    executionState: "idle",
    output: { type: "stream", stream: "stdout", text: "" },
    ...overrides,
  };
}

describe("ExecutionIndicator", () => {
  it("shows dash when idle with no execution count", () => {
    render(<ExecutionIndicator cell={makeCell({ executionState: "idle", executionCount: null })} />);
    expect(screen.getByText(/Exec\. times \[-\]/)).toBeInTheDocument();
  });

  it("shows count when idle with an execution count", () => {
    render(<ExecutionIndicator cell={makeCell({ executionState: "idle", executionCount: 7 })} />);
    expect(screen.getByText(/Exec\. times \[7\]/)).toBeInTheDocument();
  });

  it("shows running indicator when running", () => {
    render(<ExecutionIndicator cell={makeCell({ executionState: "running" })} />);
    expect(screen.getByText(/Running \[/)).toBeInTheDocument();
  });

  it("shows running indicator when queued", () => {
    render(<ExecutionIndicator cell={makeCell({ executionState: "queued" })} />);
    expect(screen.getByText(/Running \[/)).toBeInTheDocument();
  });

  it("shows count with red text on error", () => {
    const { container } = render(
      <ExecutionIndicator cell={makeCell({ executionState: "error", executionCount: 2 })} />
    );
    const span = container.querySelector("span");
    expect(span).toHaveClass("text-red-500");
    expect(span?.textContent).toContain("2");
  });
});
