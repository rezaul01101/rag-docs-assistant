import type { Route } from "./+types/home";
import { AdminLayout } from "../components/layout/admin-layout";
import { FileManager } from "../components/file-manager";
import { ChatPanel } from "../components/chat-panel";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard" },
    { name: "description", content: "Simple admin dashboard template" },
  ];
}

export default function Home() {
  return (
    <AdminLayout>
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="min-h-10">
          <FileManager />
        </div>
        <div className="min-h-10">
          <ChatPanel />
        </div>
      </div>
    </AdminLayout>
  );
}
