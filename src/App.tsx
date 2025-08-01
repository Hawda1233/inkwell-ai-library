import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/auth/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { StudentDashboard } from "./pages/student/Dashboard";
import { Books } from "./pages/admin/Books";
import { Students } from "./pages/admin/Students";
import { LibrarySessions } from "./pages/admin/LibrarySessions";
import { OverdueBooks } from "./pages/admin/OverdueBooks";
import { Reservations } from "./pages/admin/Reservations";
import { Analytics } from "./pages/admin/Analytics";
import { Settings } from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/books" element={<Books />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/sessions" element={<LibrarySessions />} />
          <Route path="/admin/overdue" element={<OverdueBooks />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/student" element={<StudentDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
