import type { ErrorOutput } from "../model/types";

interface ErrorOutputViewProps {
  output: ErrorOutput;
}

// eslint-disable-next-line no-control-regex
const ansiRe = /\x1b\[[0-9;]*m/g;

export function ErrorOutputView({ output }: ErrorOutputViewProps) {
  const traceback = output.traceback
    .map((line) => line.replace(ansiRe, ""))
    .join("\n");

  return (
    <div className="px-4 py-3">
      <p className="mb-1.5 font-mono text-xs font-semibold text-red-600">
        {output.ename}: {output.evalue}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-red-700">
        {traceback}
      </pre>
    </div>
  );
}
