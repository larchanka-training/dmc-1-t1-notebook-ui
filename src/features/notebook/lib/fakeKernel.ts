// STUB — throwaway, replace with a real kernel connection.
import type { CellOutput } from "../model/types";

let counter = 0;

export async function executeCode(source: string): Promise<{
  output: CellOutput;
  status: "ok" | "error";
  executionCount: number;
}> {
  await new Promise<void>((resolve) =>
    window.setTimeout(resolve, 300 + Math.random() * 500)
  );

  counter += 1;
  const executionCount = counter;

  if (source.includes("error")) {
    return {
      output: {
        type: "error",
        ename: "TypeError",
        evalue: "Cannot read properties of undefined (reading 'map')",
        traceback: [
          "Traceback (most recent call last):",
          "  File \"<stdin>\", line 1, in <module>",
          "TypeError: Cannot read properties of undefined (reading 'map')",
        ],
      },
      status: "error",
      executionCount,
    };
  }

  const logMatch = /console\.log\(["'`](.+?)["'`]\)/.exec(source);
  if (logMatch !== null) {
    return {
      output: { type: "stream", stream: "stdout", text: logMatch[1] + "\n" },
      status: "ok",
      executionCount,
    };
  }

  const lines = source.split("\n").filter((l) => l.trim() !== "");
  const lastLine = lines.length > 0 ? lines[lines.length - 1] : "";
  return {
    output: { type: "execute_result", data: { "text/plain": lastLine } },
    status: "ok",
    executionCount,
  };
}
