import Sidebar from "./Sidebar";
import { ProtectedRoute } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <Sidebar />
        <main className="md:ml-60 min-h-screen">
          <div className="pt-16 md:pt-0 p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
