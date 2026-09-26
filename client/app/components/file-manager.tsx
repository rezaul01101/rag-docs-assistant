import { useState } from "react";
import { FileUpload } from "./file-upload";
import { UploadedFilesList } from "./uploaded-files-list";

type Tab = "upload" | "files";

const TABS: { id: Tab; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "files", label: "Uploaded Files" },
];

export function FileManager() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          File Upload
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tab === "upload"
            ? "Select PDF or TXT files, then click Upload to send them to the server."
            : "Files stored on the server. Delete removes them permanently."}
        </p>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "upload" ? <FileUpload /> : <UploadedFilesList />}
      </div>
    </section>
  );
}
