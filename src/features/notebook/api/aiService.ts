import { apiClient } from "../../../shared/api/apiClient";
import type { Cell } from "../model/types";

interface ContextResponse {
  prompt: string;
}

interface GenerateResponse {
  code: string;
}

export async function generateCode(
  userPrompt: string,
  cells: Cell[],
  targetCellId: string,
): Promise<string> {
  const ctx = await apiClient.post<ContextResponse>("/ai/context", {
    cells,
    targetCellId,
    includeOutputs: true,
  });

  const fullPrompt = ctx.prompt
    ? `${ctx.prompt}\n\nUser instruction: ${userPrompt}`
    : userPrompt;

  const result = await apiClient.post<GenerateResponse>("/ai/generate", {
    prompt: fullPrompt,
  });

  return result.code;
}
