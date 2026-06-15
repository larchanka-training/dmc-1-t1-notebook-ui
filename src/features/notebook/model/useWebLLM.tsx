/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

export type WebLLMStatus = "preparing" | "ready" | "error";

interface WebLLMContextValue {
  status: WebLLMStatus;
  error: string | null;
  generate: (prompt: string) => Promise<string>;
}

const WebLLMContext = createContext<WebLLMContextValue | null>(null);

export function useWebLLM(): WebLLMContextValue {
  const ctx = useContext(WebLLMContext);
  if (ctx === null) throw new Error("useWebLLM must be used inside WebLLMProvider");
  return ctx;
}

interface WebLLMProviderProps {
  children: ReactNode;
}

export function WebLLMProvider({ children }: WebLLMProviderProps) {
  const [status, setStatus] = useState<WebLLMStatus>("preparing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const engineRef = useRef<MLCEngine | null>(null);
  const loadErrorRef = useRef<unknown>(null);
  const initStartedRef = useRef(false);

  // readyPromise always resolves (never rejects) once initialization is settled.
  // generate() awaits it and then checks engineRef — if the engine failed to
  // load, engineRef is null and generate() re-throws the original load error.
  const readyResolveRef = useRef<() => void>(() => {});
  const readyPromiseRef = useRef<Promise<void>>(
    new Promise<void>((resolve) => {
      readyResolveRef.current = resolve;
    })
  );

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    CreateMLCEngine(MODEL_ID)
      .then((engine) => {
        engineRef.current = engine;
        setStatus("ready");
        readyResolveRef.current();
      })
      .catch((err: unknown) => {
        console.error("[WebLLM] Engine failed to load:", err);
        loadErrorRef.current = err;
        setErrorMessage(err instanceof Error ? err.message : String(err));
        setStatus("error");
        readyResolveRef.current();
      });
  }, []);

  const generate = useCallback(async (prompt: string): Promise<string> => {
    console.log("[WebLLM] generate() called, awaiting ready...");
    await readyPromiseRef.current;
    console.log("[WebLLM] ready resolved, engineRef:", engineRef.current);
    const engine = engineRef.current;
    if (!engine) {
      console.error("[WebLLM] engine is null, throwing load error:", loadErrorRef.current);
      throw loadErrorRef.current ?? new Error("WebLLM engine not available");
    }

    console.log("[WebLLM] calling engine.chat.completions.create...");
    let chunks: AsyncIterable<unknown>;
    try {
      chunks = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });
      console.log("[WebLLM] got stream object:", chunks);
    } catch (err) {
      console.error("[WebLLM] create() threw:", err);
      throw err;
    }

    let result = "";
    let chunkCount = 0;
    try {
      for await (const chunk of chunks as AsyncIterable<{ choices: { delta: { content?: string | null } }[] }>) {
        chunkCount++;
        const piece = chunk.choices[0]?.delta?.content ?? "";
        console.log(`[WebLLM] chunk #${chunkCount}:`, JSON.stringify(piece));
        result += piece;
      }
    } catch (err) {
      console.error("[WebLLM] error during stream iteration:", err);
      throw err;
    }
    console.log(`[WebLLM] done. ${chunkCount} chunks, result length: ${result.length}`);
    return result;
  }, []);

  return (
    <WebLLMContext.Provider value={{ status, error: errorMessage, generate }}>
      {children}
    </WebLLMContext.Provider>
  );
}
