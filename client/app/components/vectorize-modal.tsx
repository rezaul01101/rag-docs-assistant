import { useEffect, useState } from "react";
import { API_BASE_URL } from "~/lib/api";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CloseIcon,
  SpinnerIcon,
} from "./icons";

export type ChunkWithEmbedding = {
  index: number;
  content: string;
  wordCount: number;
  embedding: number[];
};

type WizardStep =
  | "idle"
  | "extracting"
  | "extracted"
  | "embedding"
  | "embedded"
  | "saving"
  | "review-loading"
  | "review";

type WizardError = { step: WizardStep; message: string } | null;

export type VectorizeModalFile = {
  filename: string;
  originalName: string;
  vectorizationStatus: string;
};

type VectorizeModalProps = {
  file: VectorizeModalFile | null;
  onClose: () => void;
  onVectorized: () => void;
};

const EXTRACTED_TEXT_PREVIEW_LIMIT = 5000;

function truncate(text: string, limit: number) {
  if (text.length <= limit) return { text, truncated: false };
  return { text: text.slice(0, limit), truncated: true };
}

function formatVectorPreview(embedding: number[], expanded: boolean) {
  if (expanded) return `[${embedding.map((n) => n.toFixed(4)).join(", ")}]`;
  return `[${embedding.slice(0, 6).map((n) => n.toFixed(4)).join(", ")}, …] (${embedding.length} dims)`;
}

async function parseJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function VectorizeModal({ file, onClose, onVectorized }: VectorizeModalProps) {
  const [step, setStep] = useState<WizardStep>("idle");
  const [extractedText, setExtractedText] = useState("");
  const [chunkPreviewCount, setChunkPreviewCount] = useState(0);
  const [textLength, setTextLength] = useState(0);
  const [chunks, setChunks] = useState<ChunkWithEmbedding[]>([]);
  const [error, setError] = useState<WizardError>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!file) return;

    setError(null);
    setExpanded(new Set());

    if (file.vectorizationStatus === "vectorized") {
      setStep("review-loading");
      loadReview(file.filename);
    } else {
      setStep("idle");
      setExtractedText("");
      setChunks([]);
      setChunkPreviewCount(0);
      setTextLength(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (!file) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  async function loadReview(filename: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}`,
      );
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data?.error ?? "Failed to load saved vector data");
      setChunks(data.chunks);
      setStep("review");
    } catch (err) {
      setError({
        step: "review-loading",
        message: err instanceof Error ? err.message : "Failed to load saved vector data",
      });
      setStep("idle");
    }
  }

  async function handleExtract() {
    if (!file) return;
    setStep("extracting");
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documents/${encodeURIComponent(file.filename)}/extract`,
        { method: "POST" },
      );
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data?.error ?? "Extraction failed");
      setExtractedText(data.extractedText);
      setChunkPreviewCount(data.chunkPreviewCount);
      setTextLength(data.textLength);
      setStep("extracted");
    } catch (err) {
      setError({
        step: "extracting",
        message: err instanceof Error ? err.message : "Extraction failed",
      });
      setStep("idle");
    }
  }

  async function handleEmbed() {
    if (!file) return;
    setStep("embedding");
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documents/${encodeURIComponent(file.filename)}/embed`,
        { method: "POST" },
      );
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data?.error ?? "Embedding failed");
      setChunks(data.chunks);
      setStep("embedded");
    } catch (err) {
      setError({
        step: "embedding",
        message: err instanceof Error ? err.message : "Embedding failed",
      });
      setStep("extracted");
    }
  }

  async function handleSave() {
    if (!file) return;
    setStep("saving");
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/documents/${encodeURIComponent(file.filename)}/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks }),
        },
      );
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data?.error ?? "Failed to save vectors");
      onVectorized();
      setStep("review");
    } catch (err) {
      setError({
        step: "saving",
        message: err instanceof Error ? err.message : "Failed to save vectors",
      });
      setStep("embedded");
    }
  }

  function toggleExpanded(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  if (!file) return null;

  const preview = truncate(extractedText, EXTRACTED_TEXT_PREVIEW_LIMIT);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {file.originalName}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {step === "review" || step === "review-loading"
                ? "Saved vector data"
                : "Extract, embed, and save to pgvector"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <p className="mb-4 flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
              <AlertCircleIcon className="size-4 shrink-0" />
              {error.message}
            </p>
          )}

          {step === "review-loading" && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-gray-500">
              <SpinnerIcon className="size-5 animate-spin" />
              Loading saved data…
            </div>
          )}

          {step === "idle" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Extract this file&apos;s text, split it into chunks, and generate
                vector embeddings.
              </p>
              <button
                type="button"
                onClick={handleExtract}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Extract text
              </button>
            </div>
          )}

          {step === "extracting" && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-gray-500">
              <SpinnerIcon className="size-5 animate-spin" />
              Extracting text…
            </div>
          )}

          {(step === "extracted" || step === "embedding") && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Extracted {textLength.toLocaleString()} characters → {chunkPreviewCount}{" "}
                chunk{chunkPreviewCount === 1 ? "" : "s"}
              </p>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-300">
                {preview.text}
                {preview.truncated &&
                  `\n… (showing first ${EXTRACTED_TEXT_PREVIEW_LIMIT.toLocaleString()} of ${textLength.toLocaleString()} characters)`}
              </pre>
              <button
                type="button"
                onClick={handleEmbed}
                disabled={step === "embedding"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {step === "embedding" && <SpinnerIcon className="size-4 animate-spin" />}
                {step === "embedding"
                  ? "Embedding… (this may take a few seconds)"
                  : "Generate embeddings"}
              </button>
            </div>
          )}

          {(step === "embedded" || step === "saving") && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {chunks.length} chunk{chunks.length === 1 ? "" : "s"} embedded
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {chunks.map((c) => (
                  <div
                    key={c.index}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <p className="mb-1 font-medium text-gray-400">
                      #{c.index} · {c.wordCount} words
                    </p>
                    <p className="mb-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {c.content}
                    </p>
                    <p className="break-all font-mono text-gray-500 dark:text-gray-400">
                      {formatVectorPreview(c.embedding, expanded.has(c.index))}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(c.index)}
                      className="mt-1 font-sans text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {expanded.has(c.index) ? "Show less" : "Show full vector"}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={step === "saving"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {step === "saving" && <SpinnerIcon className="size-4 animate-spin" />}
                {step === "saving" ? "Saving…" : "Save to database"}
              </button>
            </div>
          )}

          {step === "review" && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircleIcon className="size-4" />
                Vectorized — {chunks.length} chunk{chunks.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Chunk text
                  </h4>
                  {chunks.map((c) => (
                    <div
                      key={c.index}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <p className="mb-1 font-medium text-gray-400">
                        #{c.index} · {c.wordCount} words
                      </p>
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Vector data
                  </h4>
                  {chunks.map((c) => (
                    <div
                      key={c.index}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <p className="mb-1 font-medium text-gray-400">
                        #{c.index} · {c.embedding.length} dims
                      </p>
                      <p className="break-all font-mono text-gray-500 dark:text-gray-400">
                        {formatVectorPreview(c.embedding, expanded.has(c.index))}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(c.index)}
                        className="mt-1 font-sans text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {expanded.has(c.index) ? "Show less" : "Show full vector"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
