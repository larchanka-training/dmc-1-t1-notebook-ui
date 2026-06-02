import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to type=button (no form submit)", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onClick handler when clicked", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Press</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler} disabled>Press</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("applies primary variant class", () => {
    render(<Button variant="primary">Save</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-stone-800");
  });

  it("applies ghost variant class by default", () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("text-stone-600");
  });

  it("applies xs size class", () => {
    render(<Button size="xs">Tiny</Button>);
    expect(screen.getByRole("button")).toHaveClass("p-1");
  });

  it("merges custom className", () => {
    render(<Button className="my-custom">X</Button>);
    expect(screen.getByRole("button")).toHaveClass("my-custom");
  });

  it("forwards additional HTML attributes", () => {
    render(<Button aria-label="close dialog">×</Button>);
    expect(screen.getByRole("button", { name: "close dialog" })).toBeInTheDocument();
  });
});
