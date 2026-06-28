import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorOutputView } from "./ErrorOutputView";

describe("ErrorOutputView", () => {
  it("renders ename and evalue", () => {
    render(
      <ErrorOutputView
        output={{ type: "error", ename: "ReferenceError", evalue: "x is not defined", traceback: [] }}
      />
    );
    expect(screen.getByText("ReferenceError: x is not defined")).toBeInTheDocument();
  });

  it("strips ANSI escape codes from traceback lines", () => {
    render(
      <ErrorOutputView
        output={{
          type: "error",
          ename: "Error",
          evalue: "oops",
          traceback: ["\x1b[31mRed line\x1b[0m", "\x1b[1mBold line\x1b[0m"],
        }}
      />
    );
    const pre = document.querySelector("pre");
    expect(pre?.textContent).toContain("Red line");
    expect(pre?.textContent).toContain("Bold line");
    expect(pre?.textContent).not.toContain("\x1b[");
  });

  it("joins traceback lines with newlines", () => {
    render(
      <ErrorOutputView
        output={{
          type: "error",
          ename: "Error",
          evalue: "bad",
          traceback: ["line one", "line two", "line three"],
        }}
      />
    );
    expect(document.querySelector("pre")?.textContent).toBe("line one\nline two\nline three");
  });

  it("renders empty traceback without crashing", () => {
    render(
      <ErrorOutputView output={{ type: "error", ename: "TypeError", evalue: "null", traceback: [] }} />
    );
    expect(screen.getByText("TypeError: null")).toBeInTheDocument();
  });
});
