import type { StreamOutput } from "../../../shared/types/notebook";

interface StreamOutputViewProps {
  output: StreamOutput;
}

export function StreamOutputView({ output }: StreamOutputViewProps) {
  return (
    <pre
      className={`overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-5 ${
        output.stream === "stderr" ? "bg-red-50 text-red-800" : "text-stone-700"
      }`}
    >
      {output.text}
    </pre>
  );
}
