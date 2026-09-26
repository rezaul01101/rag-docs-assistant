import type { Route } from "./+types/home";
import { AdminLayout } from "../components/layout/admin-layout";
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
      <div className="h-full">
        <ChatPanel />
      </div>
    </AdminLayout>
  );
}
