import { OLLAMA_BASE_URL } from "./embedding.service";

export const CHAT_MODEL = "gemma3:4b";

export interface ContextChunk {
  content: string;
  originalName: string;
}

function buildSystemPrompt(chunks: ContextChunk[]): string {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] (source: ${chunk.originalName})\n${chunk.content}`)
    .join("\n\n");

  return (
    "You are a helpful assistant that answers questions using only the context below. " +
    "If the answer cannot be found in the context, say you don't know — don't make anything up. " +
    "Cite sources inline using [1], [2], etc. matching the context blocks.\n\n" +
    `Context:\n${context}`
  );
}

export async function generateAnswer(
  question: string,
  chunks: ContextChunk[],
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: false,
      messages: [
        { role: "system", content: buildSystemPrompt(chunks) },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat request failed (${res.status})`);
  }

  const data = (await res.json()) as { message?: { content?: string } };

  if (!data.message?.content) {
    throw new Error("Ollama returned an unexpected chat response");
  }

  return data.message.content;
}
