import { Navigation } from "@/components/Navigation";
import { OverdueBooksManager } from "@/components/admin/OverdueBooksManager";

export const OverdueBooks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Overdue Books</h1>
          <p className="text-muted-foreground mt-2">
            Manage fines and track overdue books
          </p>
        </div>
        <OverdueBooksManager />
      </div>
    </div>
  );
};