import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { WebLLMProvider, useWebLLM } from "./useWebLLM";

// ---------- Mock @mlc-ai/web-llm ----------

const mockCreate = vi.fn();
const mockEngine = {
  chat: { completions: { create: mockCreate } },
};
const mockCreateMLCEngine = vi.fn();

vi.mock("@mlc-ai/web-llm", () => ({
  CreateMLCEngine: (...args: unknown[]) => mockCreateMLCEngine(...args),
}));

// ---------- Test helpers ----------

function Probe({ onCapture }: { onCapture: (ctx: ReturnType<typeof useWebLLM>) => void }) {
  const ctx = useWebLLM();
  onCapture(ctx);
  return <span data-testid="status">{ctx.status}</span>;
}

function renderProvider() {
  let captured: ReturnType<typeof useWebLLM> | null = null;
  render(
    <WebLLMProvider>
      <Probe onCapture={(ctx) => { captured = ctx; }} />
    </WebLLMProvider>
  );
  return { getCtx: () => captured! };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------- Tests ----------

describe("WebLLMProvider / useWebLLM", () => {
  it("starts with status 'preparing'", () => {
    mockCreateMLCEngine.mockReturnValue(new Promise(() => {})); // never resolves
    renderProvider();
    expect(screen.getByTestId("status").textContent).toBe("preparing");
  });

  it("transitions to 'ready' when the engine loads", async () => {
    mockCreateMLCEngine.mockResolvedValue(mockEngine);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready")
    );
  });

  it("transitions to 'error' when the engine fails to load", async () => {
    mockCreateMLCEngine.mockRejectedValue(new Error("WebGPU not supported"));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("error")
    );
  });

  it("throws inside WebLLMProvider when useWebLLM is used outside provider", () => {
    // Suppress React's expected error output for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe onCapture={() => {}} />)).toThrow(
      "useWebLLM must be used inside WebLLMProvider"
    );
    spy.mockRestore();
  });

  it("generate() calls the engine with the given prompt", async () => {
    mockCreateMLCEngine.mockResolvedValue(mockEngine);
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "the answer" } }],
    });

    const { getCtx } = renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready")
    );

    let result: string | undefined;
    await act(async () => {
      result = await getCtx().generate("my question");
    });

    expect(result).toBe("the answer");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "my question" }],
      })
    );
  });

  it("generate() called during warmup waits and then executes", async () => {
    let resolveEngine!: (e: typeof mockEngine) => void;
    mockCreateMLCEngine.mockReturnValue(
      new Promise<typeof mockEngine>((resolve) => { resolveEngine = resolve; })
    );
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "deferred answer" } }],
    });

    const { getCtx } = renderProvider();
    expect(screen.getByTestId("status").textContent).toBe("preparing");

    // Start generation while the engine is still loading
    const resultPromise = getCtx().generate("queued prompt");

    // Engine must not have been called yet
    expect(mockCreate).not.toHaveBeenCalled();

    // Resolve engine inside act() so the React state update is handled
    await act(async () => {
      resolveEngine(mockEngine);
      await resultPromise;
    });

    expect(await resultPromise).toBe("deferred answer");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("generate() throws when the engine failed to load", async () => {
    mockCreateMLCEngine.mockRejectedValue(new Error("WebGPU not supported"));

    const { getCtx } = renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("error")
    );

    // generate() re-throws the original load error stored in loadErrorRef
    await expect(getCtx().generate("hello")).rejects.toThrow("WebGPU not supported");
  });

  it("generate() returns empty string when engine returns null content", async () => {
    mockCreateMLCEngine.mockResolvedValue(mockEngine);
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const { getCtx } = renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready")
    );

    let result: string | undefined;
    await act(async () => {
      result = await getCtx().generate("prompt");
    });

    expect(result).toBe("");
  });
});
