export interface Chunk {
  index: number;
  content: string;
  wordCount: number;
}

export const CHUNK_SIZE_WORDS = 500;
export const CHUNK_OVERLAP_WORDS = 50;
export const MIN_TRAILING_CHUNK_WORDS = 20;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function splitIntoSegments(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (countWords(paragraph) <= CHUNK_SIZE_WORDS) {
      segments.push(paragraph.trim());
      continue;
    }

    const sentences = paragraph.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    for (const sentence of sentences) {
      if (countWords(sentence) <= CHUNK_SIZE_WORDS) {
        segments.push(sentence.trim());
        continue;
      }

      const words = splitWords(sentence);
      for (let i = 0; i < words.length; i += CHUNK_SIZE_WORDS) {
        segments.push(words.slice(i, i + CHUNK_SIZE_WORDS).join(" "));
      }
    }
  }

  return segments;
}

export function chunkText(text: string): Chunk[] {
  const segments = splitIntoSegments(text);
  const chunks: string[] = [];
  let currentWords: string[] = [];

  for (const segment of segments) {
    const segmentWords = splitWords(segment);

    if (
      currentWords.length > 0 &&
      currentWords.length + segmentWords.length > CHUNK_SIZE_WORDS
    ) {
      chunks.push(currentWords.join(" "));
      const overlapWords = currentWords.slice(-CHUNK_OVERLAP_WORDS);
      currentWords = [...overlapWords];
    }

    currentWords.push(...segmentWords);

    while (currentWords.length > CHUNK_SIZE_WORDS) {
      chunks.push(currentWords.slice(0, CHUNK_SIZE_WORDS).join(" "));
      currentWords = currentWords.slice(CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS);
    }
  }

  if (currentWords.length > 0) {
    if (currentWords.length < MIN_TRAILING_CHUNK_WORDS && chunks.length > 0) {
      const last = chunks.pop() as string;
      chunks.push(`${last} ${currentWords.join(" ")}`);
    } else {
      chunks.push(currentWords.join(" "));
    }
  }

  return chunks.map((content, index) => ({
    index,
    content,
    wordCount: countWords(content),
  }));
}
