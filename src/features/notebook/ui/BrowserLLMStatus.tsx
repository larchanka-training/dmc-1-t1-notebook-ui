import { useWebLLM, type WebLLMStatus } from "../model/useWebLLM";

const dotClass: Record<WebLLMStatus, string> = {
  ready: "bg-green-400",
  error: "bg-red-400",
  preparing: "",
};

export function BrowserLLMStatus() {
  const { status, error } = useWebLLM();

  return (
    <div className="flex items-center gap-1.5">
      {status === "preparing" ? (
        <span className="inline-block h-2 w-2 animate-spin rounded-full border-2 border-stone-300 border-t-stone-500" />
      ) : (
        <span className={`h-2 w-2 rounded-full ${dotClass[status]}`} />
      )}
      <span className="text-xs text-stone-500">
        Browser LLM ·{" "}
        {status === "error" && error ? (
          <span
            className="underline decoration-dotted cursor-help"
            title={error}
          >
            error
          </span>
        ) : (
          status
        )}
      </span>
    </div>
  );
}
