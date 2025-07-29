import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Download, Calendar, FileText, Users, BookOpen } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportGenerator = ({ open, onOpenChange }: ReportGeneratorProps) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("comprehensive");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [includeOptions, setIncludeOptions] = useState({
    books: true,
    transactions: true,
    students: true,
    analytics: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: "comprehensive", label: "Comprehensive Report", description: "All library data and statistics" },
    { value: "transactions", label: "Transaction Report", description: "Borrowing and return records" },
    { value: "inventory", label: "Inventory Report", description: "Book catalog and availability" },
    { value: "analytics", label: "Analytics Report", description: "Usage patterns and trends" },
    { value: "overdue", label: "Overdue Report", description: "Late returns and penalties" }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const reportData = [];
      const now = new Date();
      const fromDate = dateRange?.from || new Date(now.getFullYear(), 0, 1); // Start of year
      const toDate = dateRange?.to || now;

      // Report Header
      reportData.push([`SmartLibrary ${reportTypes.find(t => t.value === reportType)?.label}`]);
      reportData.push([`Generated: ${now.toLocaleString()}`]);
      reportData.push([`Period: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`]);
      reportData.push(['']);

      // Fetch data based on report type
      if (reportType === "comprehensive" || reportType === "analytics") {
        // Library Statistics
        const [booksResponse, transactionsResponse, studentsResponse] = await Promise.all([
          supabase.from('books').select('*'),
          supabase.from('book_transactions').select('*').gte('transaction_date', fromDate.toISOString()).lte('transaction_date', toDate.toISOString()),
          supabase.from('user_roles').select('user_id').eq('role', 'student')
        ]);

        const books = booksResponse.data || [];
        const transactions = transactionsResponse.data || [];
        const students = studentsResponse.data || [];

        reportData.push(['LIBRARY STATISTICS']);
        reportData.push(['Metric', 'Value']);
        reportData.push(['Total Books', books.length]);
        reportData.push(['Total Copies', books.reduce((sum, book) => sum + book.total_copies, 0)]);
        reportData.push(['Available Copies', books.reduce((sum, book) => sum + book.available_copies, 0)]);
        reportData.push(['Borrowed Copies', books.reduce((sum, book) => sum + (book.total_copies - book.available_copies), 0)]);
        reportData.push(['Active Students', students.length]);
        reportData.push(['Total Transactions (Period)', transactions.length]);
        reportData.push(['Active Loans', transactions.filter(t => t.status === 'active').length]);
        reportData.push(['Overdue Items', transactions.filter(t => t.status === 'active' && new Date(t.due_date) < now).length]);
        reportData.push(['']);
      }

      if (reportType === "comprehensive" || reportType === "transactions") {
        // Transaction Data
        const { data: transactions } = await supabase
          .from('book_transactions')
          .select(`
            *,
            books(title, author, isbn)
          `)
          .gte('transaction_date', fromDate.toISOString())
          .lte('transaction_date', toDate.toISOString())
          .order('transaction_date', { ascending: false });

        reportData.push(['TRANSACTIONS']);
        reportData.push(['Date', 'Type', 'Book Title', 'Author', 'ISBN', 'Status', 'Due Date', 'Return Date']);
        
        transactions?.forEach(t => {
          reportData.push([
            new Date(t.transaction_date).toLocaleDateString(),
            t.transaction_type,
            t.books?.title || 'Unknown',
            t.books?.author || 'Unknown',
            t.books?.isbn || '',
            t.status,
            t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
            t.returned_date ? new Date(t.returned_date).toLocaleDateString() : ''
          ]);
        });
        reportData.push(['']);
      }

      if (reportType === "comprehensive" || reportType === "inventory") {
        // Book Inventory
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .order('title');

        reportData.push(['BOOK INVENTORY']);
        reportData.push(['Title', 'Author', 'ISBN', 'Category', 'Publisher', 'Year', 'Total Copies', 'Available', 'Borrowed', 'Shelf Location']);
        
        books?.forEach(book => {
          reportData.push([
            book.title,
            book.author,
            book.isbn || '',
            book.category || '',
            book.publisher || '',
            book.publication_year || '',
            book.total_copies,
            book.available_copies,
            book.total_copies - book.available_copies,
            book.location_shelf || ''
          ]);
        });
        reportData.push(['']);
      }

      if (reportType === "overdue") {
        // Overdue Books
        const { data: overdueTransactions } = await supabase
          .from('book_transactions')
          .select(`
            *,
            books(title, author, isbn)
          `)
          .eq('status', 'active')
          .lt('due_date', now.toISOString())
          .order('due_date');

        reportData.push(['OVERDUE BOOKS']);
        reportData.push(['Student ID', 'Book Title', 'Author', 'Due Date', 'Days Overdue', 'Transaction Date']);
        
        overdueTransactions?.forEach(t => {
          const daysOverdue = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24));
          reportData.push([
            t.student_id,
            t.books?.title || 'Unknown',
            t.books?.author || 'Unknown',
            new Date(t.due_date).toLocaleDateString(),
            daysOverdue,
            new Date(t.transaction_date).toLocaleDateString()
          ]);
        });
      }

      // Generate CSV
      const csvContent = reportData.map(row => 
        Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
      ).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}-report-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Generated",
        description: `${reportTypes.find(t => t.value === reportType)?.label} has been downloaded.`,
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
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Create detailed reports for your library system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <p className="text-xs text-muted-foreground">
              Leave empty to include all data from the beginning of the year
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};