import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import { BlockedRequestBanner } from "./BlockedRequestBanner";

describe("BlockedRequestBanner", () => {
  it("renders nothing by default", () => {
    render(<BlockedRequestBanner />);
    expect(screen.queryByText(/uBlock Origin/i)).toBeNull();
  });

  it("shows warning when api:request-blocked event fires", () => {
    render(<BlockedRequestBanner />);
    act(() => {
      window.dispatchEvent(new CustomEvent("api:request-blocked"));
    });
    expect(screen.getByText(/uBlock Origin/i)).toBeTruthy();
  });

  it("hides on Dismiss click", () => {
    render(<BlockedRequestBanner />);
    act(() => {
      window.dispatchEvent(new CustomEvent("api:request-blocked"));
    });
    const dismiss = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.click(dismiss);
    expect(screen.queryByText(/uBlock Origin/i)).toBeNull();
  });
});
