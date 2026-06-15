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
    await readyPromiseRef.current;
    const engine = engineRef.current;
    if (!engine) throw loadErrorRef.current ?? new Error("WebLLM engine not available");

    const reply = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
    });

    return reply.choices[0]?.message.content ?? "";
  }, []);

  return (
    <WebLLMContext.Provider value={{ status, error: errorMessage, generate }}>
      {children}
    </WebLLMContext.Provider>
  );
}
