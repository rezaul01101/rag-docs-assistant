import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "~/lib/api";
import { formatBytes } from "~/lib/format";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileIcon,
  ImageIcon,
  TrashIcon,
  UploadIcon,
} from "./icons";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type UploadedFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".txt"];

function isAcceptedFile(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function uploadWithProgress(file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (parsed?.error) message = parsed.error;
      } catch {
        // ignore unparsable error body
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.send(formData);
  });
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<UploadedFile[]>(files);
  filesRef.current = files;

  useEffect(() => {
    return () => {
      for (const { previewUrl } of filesRef.current) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const next: UploadedFile[] = Array.from(fileList)
      .filter(isAcceptedFile)
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "idle",
        progress: 0,
        error: null,
      }));

    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function updateFile(id: string, patch: Partial<UploadedFile>) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  async function uploadAll() {
    const pending = filesRef.current.filter(
      (f) => f.status === "idle" || f.status === "error",
    );

    await Promise.all(
      pending.map(async ({ id, file }) => {
        updateFile(id, { status: "uploading", progress: 0, error: null });
        try {
          await uploadWithProgress(file, (progress) =>
            updateFile(id, { progress }),
          );
          updateFile(id, { status: "success", progress: 100 });
        } catch (err) {
          updateFile(id, {
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }),
    );
  }

  const pendingCount = files.filter(
    (f) => f.status === "idle" || f.status === "error",
  ).length;
  const isUploading = files.some((f) => f.status === "uploading");

  return (
    <div className="flex h-full flex-col">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
        }`}
      >
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <UploadIcon className="size-5" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          <span className="text-indigo-600 dark:text-indigo-400">
            Click to browse
          </span>{" "}
          or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          PDF or TXT files only
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            No files added yet
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map(({ id, file, previewUrl, status, progress, error }) => (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-800/50"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-gray-400 dark:bg-gray-900">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="size-5" />
                    ) : (
                      <FileIcon className="size-5" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(file.size)}
                  </p>

                  {status === "uploading" && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
                        {progress}%
                      </span>
                    </div>
                  )}

                  {status === "error" && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircleIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{error}</span>
                    </p>
                  )}
                </div>

                {status === "success" ? (
                  <span
                    aria-label="Uploaded"
                    className="shrink-0 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircleIcon className="size-5" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    disabled={status === "uploading"}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-rose-400"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {files.length > 0 && (
        <button
          type="button"
          onClick={uploadAll}
          disabled={pendingCount === 0 || isUploading}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isUploading
            ? "Uploading…"
            : pendingCount > 0
              ? `Upload ${pendingCount} file${pendingCount === 1 ? "" : "s"}`
              : "All files uploaded"}
        </button>
      )}
    </div>
  );
}
