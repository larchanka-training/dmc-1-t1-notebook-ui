import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCode } from "./aiService";
import { apiClient } from "../../../shared/api/apiClient";
import type { Cell } from "../model/types";

vi.mock("../../../shared/api/apiClient", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockPost = vi.mocked(apiClient.post);

const cells: Cell[] = [
  {
    id: "cell-1",
    type: "code",
    source: "const x = 1;",
    executionCount: 1,
    output: { type: "execute_result", text: "1" },
    executionState: "idle",
  },
  {
    id: "cell-2",
    type: "markdown",
    source: "## Hello",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateCode", () => {
  it("calls /ai/context with cells, targetCellId, and includeOutputs", async () => {
    mockPost
      .mockResolvedValueOnce({ prompt: "context text" })
      .mockResolvedValueOnce({ code: "console.log(1);" });

    await generateCode("do something", cells, "cell-2");

    expect(mockPost).toHaveBeenNthCalledWith(1, "/ai/context", {
      cells,
      targetCellId: "cell-2",
      includeOutputs: true,
    });
  });

  it("calls /ai/generate with context prompt prepended to user prompt", async () => {
    mockPost
      .mockResolvedValueOnce({ prompt: "CONTEXT" })
      .mockResolvedValueOnce({ code: "const a = 1;" });

    await generateCode("do something", cells, "cell-2");

    expect(mockPost).toHaveBeenNthCalledWith(2, "/ai/generate", {
      prompt: "CONTEXT\n\nUser instruction: do something",
    });
  });

  it("uses only user prompt when context prompt is empty", async () => {
    mockPost
      .mockResolvedValueOnce({ prompt: "" })
      .mockResolvedValueOnce({ code: "const b = 2;" });

    await generateCode("do something else", cells, "cell-2");

    expect(mockPost).toHaveBeenNthCalledWith(2, "/ai/generate", {
      prompt: "do something else",
    });
  });

  it("returns the code field from the generate response", async () => {
    mockPost
      .mockResolvedValueOnce({ prompt: "ctx" })
      .mockResolvedValueOnce({ code: "fetch('/api').then(console.log);" });

    const result = await generateCode("fetch data", cells, "cell-2");

    expect(result).toBe("fetch('/api').then(console.log);");
  });

  it("propagates errors from /ai/context", async () => {
    mockPost.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    await expect(generateCode("prompt", cells, "cell-1")).rejects.toThrow("Rate limit exceeded");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("propagates errors from /ai/generate", async () => {
    mockPost
      .mockResolvedValueOnce({ prompt: "ctx" })
      .mockRejectedValueOnce(new Error("Bedrock throttled — retry shortly"));

    await expect(generateCode("prompt", cells, "cell-1")).rejects.toThrow("Bedrock throttled");
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});
