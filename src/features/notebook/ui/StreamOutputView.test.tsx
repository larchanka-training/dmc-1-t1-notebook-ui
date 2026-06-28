import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StreamOutputView } from "./StreamOutputView";

describe("StreamOutputView", () => {
  it("renders stdout text", () => {
    const { container } = render(
      <StreamOutputView output={{ type: "stream", stream: "stdout", text: "hello world\n" }} />
    );
    expect(container.querySelector("pre")?.textContent).toBe("hello world\n");
  });

  it("renders stderr text", () => {
    const { container } = render(
      <StreamOutputView output={{ type: "stream", stream: "stderr", text: "error!\n" }} />
    );
    expect(container.querySelector("pre")?.textContent).toBe("error!\n");
  });

  it("applies red styling for stderr", () => {
    const { container } = render(
      <StreamOutputView output={{ type: "stream", stream: "stderr", text: "oops" }} />
    );
    expect(container.querySelector("pre")).toHaveClass("text-red-800");
  });

  it("does not apply red styling for stdout", () => {
    const { container } = render(
      <StreamOutputView output={{ type: "stream", stream: "stdout", text: "ok" }} />
    );
    expect(container.querySelector("pre")).not.toHaveClass("text-red-800");
  });

  it("renders inside a pre element", () => {
    const { container } = render(
      <StreamOutputView output={{ type: "stream", stream: "stdout", text: "x" }} />
    );
    expect(container.querySelector("pre")).toBeInTheDocument();
  });
});
