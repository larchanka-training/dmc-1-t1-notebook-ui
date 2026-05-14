import { useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { useNotebook, notebookActions } from "../model/notebookContext";
import { cn } from "../../../shared/lib/cn";

interface CellEditorProps {
  cellId: string;
  source: string;
  language: "javascript" | "markdown" | "plain";
  stretch?: boolean;
}

export function CellEditor({ cellId, source, language, stretch = false }: CellEditorProps) {
  const { dispatch } = useNotebook();
  const timerRef = useRef<number | undefined>(undefined);

  const handleChange = useCallback(
    (value: string) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        dispatch(notebookActions.updateSource(cellId, value));
      }, 150);
    },
    [cellId, dispatch]
  );

  const extensions = (() => {
    switch (language) {
      case "javascript":
        return [javascript()];
      case "markdown":
        return [markdown()];
      case "plain":
        return [];
    }
  })();

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden border transition-colors",
        "border-neutral-100 bg-neutral-50",
        "focus-within:border-blue-300 focus-within:bg-blue-100",
        stretch && "h-full"
      )}
    >
      <CodeMirror
        value={source}
        onChange={handleChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
        height={stretch ? "100%" : undefined}
        className={cn("text-sm", stretch && "h-full")}
      />
    </div>
  );
}
