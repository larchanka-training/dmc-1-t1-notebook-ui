// STUB — throwaway. Real usage would call an LLM endpoint via the AI API.
export async function generateCode(prompt: string): Promise<string> {
  await new Promise<void>((resolve) =>
    window.setTimeout(resolve, 500 + Math.random() * 700)
  );
  return `// Generated for: ${prompt}\nconsole.log("TODO: implement");`;
}
