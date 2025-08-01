import { Navigation } from "@/components/Navigation";
import { BookReservationManager } from "@/components/admin/BookReservationManager";

export const Reservations = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Book Reservations</h1>
          <p className="text-muted-foreground mt-2">
            Manage book reservations and requests
          </p>
        </div>
        <BookReservationManager />
      </div>
    </div>
  );
};