import { useEffect, useState } from "react";
import { API_BASE_URL } from "~/lib/api";
import { formatBytes } from "~/lib/format";
import { ConfirmModal } from "./confirm-modal";
import { AlertCircleIcon, FileIcon, SparkleIcon, TrashIcon } from "./icons";
import { VectorizeModal } from "./vectorize-modal";

type StoredFile = {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  vectorizationStatus: string;
};

export function UploadedFilesList() {
  const [files, setFiles] = useState<StoredFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredFile | null>(null);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(
    null,
  );
  const [activeVectorizeFile, setActiveVectorizeFile] =
    useState<StoredFile | null>(null);

  async function loadFiles() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`);
      if (!res.ok) throw new Error("Failed to load uploaded files");
      const data = await res.json();
      setFiles(data.files);
    } catch (err) {
      setFiles([]);
      setError(
        err instanceof Error ? err.message : "Failed to load uploaded files",
      );
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;

    setDeletingFilename(target.filename);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/upload/${encodeURIComponent(target.filename)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete file");
      setFiles((prev) =>
        prev ? prev.filter((f) => f.filename !== target.filename) : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeletingFilename(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {error && (
        <p className="mb-3 flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircleIcon className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {files === null ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            Loading…
          </p>
        ) : files.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No files uploaded yet
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.filename}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-gray-400 dark:bg-gray-900">
                  <FileIcon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <a
                    href={`${API_BASE_URL}${f.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-gray-800 hover:underline dark:text-gray-100"
                  >
                    {f.originalName}
                  </a>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(f.size)}
                  </p>
                </div>

                {f.vectorizationStatus === "vectorized" && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Vectorized
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveVectorizeFile(f)}
                  aria-label={
                    f.vectorizationStatus === "vectorized"
                      ? `View vector data for ${f.originalName}`
                      : `Extract and vectorize ${f.originalName}`
                  }
                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                >
                  <SparkleIcon className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(f)}
                  disabled={deletingFilename === f.filename}
                  aria-label={`Delete ${f.originalName}`}
                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-rose-400"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete file"
        message={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.originalName}"? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <VectorizeModal
        file={activeVectorizeFile}
        onClose={() => setActiveVectorizeFile(null)}
        onVectorized={loadFiles}
      />
    </div>
  );
}
