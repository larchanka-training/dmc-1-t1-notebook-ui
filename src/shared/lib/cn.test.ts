import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("px-4")).toBe("px-4");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("filters out falsy values", () => {
    expect(cn("px-4", false, null, undefined, "py-2")).toBe("px-4 py-2");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
  });

  it("deduplicates conflicting arbitrary Tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional class patterns", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")).toBe(
      "btn btn-active"
    );
  });
});
