export const DEFAULT_TOP_K = 5;

export interface SimilarChunkRow {
  content: string;
  chunk_index: number;
  filename: string;
  original_name: string;
  similarity: number;
}

export interface ChatSource {
  filename: string;
  originalName: string;
  chunkIndex: number;
  similarity: number;
}

export function toChatSource(row: SimilarChunkRow): ChatSource {
  return {
    filename: row.filename,
    originalName: row.original_name,
    chunkIndex: row.chunk_index,
    similarity: Number(row.similarity),
  };
}
