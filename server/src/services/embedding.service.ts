export const EMBEDDING_MODEL = "nomic-embed-text";
export const EMBEDDING_DIMENSIONS = 768;

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function embedChunk(content: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: content }),
  });

  if (!res.ok) {
    throw new Error(`Ollama embeddings request failed (${res.status})`);
  }

  const data = (await res.json()) as { embedding?: unknown };

  if (
    !Array.isArray(data.embedding) ||
    data.embedding.length !== EMBEDDING_DIMENSIONS ||
    !data.embedding.every((n) => typeof n === "number")
  ) {
    throw new Error("Ollama returned an unexpected embedding shape");
  }

  return data.embedding as number[];
}
