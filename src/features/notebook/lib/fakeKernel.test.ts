import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { executeCode } from "./fakeKernel";

describe("executeCode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error output when source contains the word 'error'", async () => {
    const promise = executeCode("throw error");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("error");
    expect(result.output.type).toBe("error");
    if (result.output.type === "error") {
      expect(result.output.ename).toBe("TypeError");
      expect(result.output.traceback).toBeInstanceOf(Array);
      expect(result.output.traceback.length).toBeGreaterThan(0);
    }
  });

  it("returns stream output for console.log with double quotes", async () => {
    const promise = executeCode('console.log("hello world")');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("ok");
    expect(result.output.type).toBe("stream");
    if (result.output.type === "stream") {
      expect(result.output.stream).toBe("stdout");
      expect(result.output.text).toBe("hello world\n");
    }
  });

  it("returns stream output for console.log with single quotes", async () => {
    const promise = executeCode("console.log('hi')");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("ok");
    expect(result.output.type).toBe("stream");
    if (result.output.type === "stream") {
      expect(result.output.text).toBe("hi\n");
    }
  });

  it("returns execute_result with last non-empty line for generic source", async () => {
    const promise = executeCode("const x = 1;\nconst y = 2;\nx + y");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("ok");
    expect(result.output.type).toBe("execute_result");
    if (result.output.type === "execute_result") {
      expect(result.output.text).toBe("x + y");
    }
  });

  it("returns execute_result with empty string for blank source", async () => {
    const promise = executeCode("   \n  \n");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("ok");
    expect(result.output.type).toBe("execute_result");
    if (result.output.type === "execute_result") {
      expect(result.output.text).toBe("");
    }
  });

  it("increments executionCount on each call", async () => {
    const p1 = executeCode("1 + 1");
    await vi.runAllTimersAsync();
    const r1 = await p1;

    const p2 = executeCode("2 + 2");
    await vi.runAllTimersAsync();
    const r2 = await p2;

    expect(r2.executionCount).toBeGreaterThan(r1.executionCount);
  });

  it("executionCount is a positive integer", async () => {
    const promise = executeCode("42");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.executionCount).toBeGreaterThan(0);
    expect(Number.isInteger(result.executionCount)).toBe(true);
  });
});
