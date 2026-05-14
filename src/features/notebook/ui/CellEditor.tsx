import { useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { useNotebook, notebookActions } from "../model/notebookContext";

interface CellEditorProps {
  cellId: string;
  source: string;
  language: "javascript" | "markdown" | "plain";
}

export function CellEditor({ cellId, source, language }: CellEditorProps) {
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
      className="text-sm"
    />
  );
}
