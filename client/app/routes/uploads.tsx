import type { Route } from "./+types/uploads";
import { AdminLayout } from "../components/layout/admin-layout";
import { FileManager } from "../components/file-manager";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Uploads" },
    { name: "description", content: "Upload and manage documents" },
  ];
}

export default function Uploads() {
  return (
    <AdminLayout title="Uploads">
      <div className="h-full">
        <FileManager />
      </div>
    </AdminLayout>
  );
}
