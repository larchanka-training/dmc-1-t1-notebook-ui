import { describe, it, expect } from "vitest";
import { randomUUID } from "./uuid";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomUUID", () => {
  it("returns a string matching UUID v4 format", () => {
    expect(randomUUID()).toMatch(UUID_RE);
  });

  it("returns a different value on each call", () => {
    const a = randomUUID();
    const b = randomUUID();
    expect(a).not.toBe(b);
  });

  it("falls back to manual generation when crypto.randomUUID is unavailable", () => {
    const original = crypto.randomUUID;
    // @ts-expect-error — intentionally removing native API to test fallback
    crypto.randomUUID = undefined;

    try {
      const id = randomUUID();
      expect(id).toMatch(UUID_RE);
    } finally {
      crypto.randomUUID = original;
    }
  });
});
