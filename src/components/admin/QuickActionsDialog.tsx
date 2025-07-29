import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  UserPlus, 
  RotateCcw, 
  AlertTriangle, 
  FileText,
  Calendar,
  RefreshCw,
  ArrowRight
} from "lucide-react";

interface QuickActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export const QuickActionsDialog = ({ open, onOpenChange, onActionComplete }: QuickActionsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleReturnOverdueBooks = async () => {
    setIsLoading(true);
    setActiveAction('overdue');
    
    try {
      // Get all overdue books
      const { data: overdueBooks, error: fetchError } = await supabase
        .from('book_transactions')
        .select('id')
        .eq('status', 'active')
        .lt('due_date', new Date().toISOString());

      if (fetchError) throw fetchError;

      if (!overdueBooks || overdueBooks.length === 0) {
        toast({
          title: "No Overdue Books",
          description: "There are no overdue books to return.",
        });
        return;
      }

      // Mark all overdue books as returned
      const { error: updateError } = await supabase
        .from('book_transactions')
        .update({
          status: 'returned',
          returned_date: new Date().toISOString()
        })
        .in('id', overdueBooks.map(book => book.id));

      if (updateError) throw updateError;

      toast({
        title: "Overdue Books Returned",
        description: `Successfully returned ${overdueBooks.length} overdue book(s).`,
      });

      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error returning overdue books:', error);
      toast({
        title: "Error Returning Books",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setActiveAction('report');

    try {
      // Fetch comprehensive library data
      const [booksResponse, transactionsResponse, studentsResponse] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('book_transactions').select(`
          *,
          books(title, author, isbn)
        `).order('transaction_date', { ascending: false }),
        supabase.from('user_roles').select('user_id').eq('role', 'student')
      ]);

      if (booksResponse.error) throw booksResponse.error;
      if (transactionsResponse.error) throw transactionsResponse.error;
      if (studentsResponse.error) throw studentsResponse.error;

      const books = booksResponse.data || [];
      const transactions = transactionsResponse.data || [];
      const students = studentsResponse.data || [];

      // Calculate statistics
      const totalBooks = books.length;
      const totalCopies = books.reduce((sum, book) => sum + book.total_copies, 0);
      const availableCopies = books.reduce((sum, book) => sum + book.available_copies, 0);
      const borrowedCopies = totalCopies - availableCopies;
      const activeTransactions = transactions.filter(t => t.status === 'active').length;
      const overdueTransactions = transactions.filter(t => 
        t.status === 'active' && new Date(t.due_date) < new Date()
      ).length;

      // Generate CSV report
      const reportData = [
        ['SmartLibrary System Report'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [''],
        ['Library Statistics'],
        ['Total Books', totalBooks],
        ['Total Copies', totalCopies],
        ['Available Copies', availableCopies],
        ['Borrowed Copies', borrowedCopies],
        ['Active Students', students.length],
        ['Active Loans', activeTransactions],
        ['Overdue Items', overdueTransactions],
        [''],
        ['Recent Transactions'],
        ['Date', 'Type', 'Book Title', 'Author', 'Status', 'Due Date'],
        ...transactions.slice(0, 50).map(t => [
          new Date(t.transaction_date).toLocaleDateString(),
          t.transaction_type,
          t.books?.title || 'Unknown',
          t.books?.author || 'Unknown',
          t.status,
          t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'
        ]),
        [''],
        ['Book Inventory'],
        ['Title', 'Author', 'ISBN', 'Category', 'Total Copies', 'Available', 'Borrowed'],
        ...books.map(book => [
          book.title,
          book.author,
          book.isbn || '',
          book.category || '',
          book.total_copies,
          book.available_copies,
          book.total_copies - book.available_copies
        ])
      ];

      const csvContent = reportData.map(row => 
        Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
      ).join('\n');

      // Download the report
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `library-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Generated",
        description: "Library report has been downloaded successfully.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error Generating Report",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const quickActions = [
    {
      id: 'overdue',
      title: 'Return All Overdue Books',
      description: 'Mark all overdue books as returned',
      icon: RotateCcw,
      action: handleReturnOverdueBooks,
      variant: 'destructive' as const,
      confirmRequired: true
    },
    {
      id: 'report',
      title: 'Generate System Report',
      description: 'Download comprehensive library analytics',
      icon: FileText,
      action: handleGenerateReport,
      variant: 'default' as const,
      confirmRequired: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quick Actions
          </DialogTitle>
          <DialogDescription>
            Perform common administrative tasks quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="w-full justify-start h-auto p-4"
              onClick={action.action}
              disabled={isLoading}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${
                  action.variant === 'destructive' 
                    ? 'bg-red-100 dark:bg-red-900' 
                    : 'bg-primary/10'
                }`}>
                  <action.icon className={`w-4 h-4 ${
                    action.variant === 'destructive' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-primary'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm opacity-80">{action.description}</p>
                </div>
                {isLoading && activeAction === action.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </div>
            </Button>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};