import { useState, type MouseEvent, type KeyboardEvent } from "react";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { generateCode } from "../lib/fakeAiCodegen";
import { Button } from "../../../shared/ui/Button";

interface AiPromptModalProps {
  cellId: string;
  open: boolean;
  onClose: () => void;
}

export function AiPromptModal({ cellId, open, onClose }: AiPromptModalProps) {
  const { dispatch } = useNotebook();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    if (prompt.trim() === "" || loading) return;
    setLoading(true);
    try {
      const code = await generateCode(prompt);
      dispatch(notebookActions.updateSource(cellId, code));
      onClose();
      setPrompt("");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-sm font-semibold text-stone-800">
          Generate code with AI
        </h2>
        <label
          className="mb-1.5 block text-xs text-stone-500"
          htmlFor="ai-prompt"
        >
          Describe what you want to build
        </label>
        <textarea
          id="ai-prompt"
          className="mb-4 w-full resize-none rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-stone-400"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. fetch data from an API and log the result"
          disabled={loading}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            disabled={loading}
            className="px-3"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleGenerate()}
            disabled={loading || prompt.trim() === ""}
            className="px-3"
          >
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
