export type VectorizationStatus =
  | "pending"
  | "extracted"
  | "embedded"
  | "vectorized"
  | "failed";

export interface DocumentRecord {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  status: VectorizationStatus;
  extracted_text: string | null;
  chunk_count: number | null;
  embedding_model: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunkRecord {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding: string;
  created_at: string;
}

export interface ChunkWithEmbedding {
  index: number;
  content: string;
  wordCount: number;
  embedding: number[];
}

export function parsePgVector(raw: string): number[] {
  return raw
    .slice(1, -1)
    .split(",")
    .map((n) => Number(n));
}

export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function toChunkWithEmbedding(row: DocumentChunkRecord): ChunkWithEmbedding {
  return {
    index: row.chunk_index,
    content: row.content,
    wordCount: row.token_count,
    embedding: parsePgVector(row.embedding),
  };
}
