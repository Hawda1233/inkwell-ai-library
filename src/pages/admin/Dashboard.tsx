import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { IssueBookDialog } from "@/components/admin/IssueBookDialog";
import { QuickActionsDialog } from "@/components/admin/QuickActionsDialog";
import { ReportGenerator } from "@/components/admin/ReportGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  BarChart3,
  RefreshCw
} from "lucide-react";

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [issueBookOpen, setIssueBookOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [reportGeneratorOpen, setReportGeneratorOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeStudents: 0,
    booksIssued: 0,
    overdueItems: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [popularBooks, setPopularBooks] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total books
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, total_copies, available_copies');

      if (booksError) throw booksError;

      // Fetch active students (users with student role)
      const { data: students, error: studentsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Fetch recent transactions without profiles join for now
      const { data: transactions, error: transactionsError } = await supabase
        .from('book_transactions')
        .select(`
          *,
          books(title)
        `)
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      // Calculate stats
      const totalBooks = books?.length || 0;
      const totalCopies = books?.reduce((sum, book) => sum + book.total_copies, 0) || 0;
      const availableCopies = books?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
      const booksIssued = totalCopies - availableCopies;

      // Get overdue transactions (where due_date is past and status is active)
      const { data: overdueTransactions, error: overdueError } = await supabase
        .from('book_transactions')
        .select('id')
        .eq('status', 'active')
        .lt('due_date', new Date().toISOString());

      if (overdueError) throw overdueError;

      setStats({
        totalBooks,
        activeStudents: students?.length || 0,
        booksIssued,
        overdueItems: overdueTransactions?.length || 0
      });

      // Process recent activities
      const processedActivities = transactions?.map(transaction => {
        const timeDiff = Date.now() - new Date(transaction.transaction_date).getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let timeString;
        if (hoursAgo < 1) {
          timeString = "Just now";
        } else if (hoursAgo < 24) {
          timeString = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeString = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        }

        return {
          type: transaction.transaction_type,
          student: `Student ${transaction.student_id.slice(0, 8)}`, // Use truncated ID for now
          book: transaction.books?.title || 'Unknown Book',
          time: timeString,
          status: transaction.status === 'active' ? 
            (transaction.transaction_type === 'borrow' ? 'issued' : 'returned') : 
            transaction.status
        };
      }) || [];

      setRecentActivities(processedActivities);

      // Get popular books (most borrowed books)
      const { data: popularBooksData, error: popularError } = await supabase
        .from('book_transactions')
        .select(`
          book_id,
          books(title, author)
        `)
        .eq('transaction_type', 'borrow');

      if (popularError) throw popularError;

      // Count borrowings per book
      const bookCounts = popularBooksData?.reduce((acc: any, transaction) => {
        const bookId = transaction.book_id;
        if (!acc[bookId]) {
          acc[bookId] = {
            title: transaction.books?.title || 'Unknown',
            author: transaction.books?.author || 'Unknown',
            count: 0
          };
        }
        acc[bookId].count++;
        return acc;
      }, {}) || {};

      // Sort by count and take top 5
      const topBooks = Object.values(bookCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      setPopularBooks(topBooks);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error Loading Dashboard",
        description: "Could not fetch dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const transactionChannel = supabase
      .channel('dashboard-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_transactions'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const booksChannel = supabase
      .channel('dashboard-books')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(booksChannel);
    };
  }, []);

  const statsCards = [
    {
      title: "Total Books",
      value: stats.totalBooks.toLocaleString(),
      change: "Updated live",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Active Students",
      value: stats.activeStudents.toLocaleString(),
      change: "Registered users",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Books Issued",
      value: stats.booksIssued.toLocaleString(),
      change: "Currently borrowed",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    },
    {
      title: "Overdue Items",
      value: stats.overdueItems.toLocaleString(),
      change: "Need attention",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation userRole="admin" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening in your library today.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => setReportGeneratorOpen(true)}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Generate Report</span>
            </Button>
            <Button 
              variant="academic" 
              className="flex items-center space-x-2"
              onClick={() => setQuickActionsOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Quick Actions</span>
            </Button>
            <Button 
              variant="default" 
              className="flex items-center space-x-2"
              onClick={() => setIssueBookOpen(true)}
            >
              <BookOpen className="w-4 h-4" />
              <span>Issue Book</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="library-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activities</span>
                </CardTitle>
                <CardDescription>
                  Latest library transactions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 smooth-transition">
                      <div className="flex-shrink-0">
                        {activity.status === 'issued' && (
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        {activity.status === 'returned' && (
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        {activity.status === 'overdue' && (
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {activity.status === 'registered' && (
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-foreground">
                          {activity.student}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.book}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge 
                          variant={
                            activity.status === 'overdue' ? 'destructive' : 
                            activity.status === 'returned' ? 'default' : 'secondary'
                          }
                        >
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                    <span>View All Activities</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Books */}
          <div className="lg:col-span-1">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Popular Books</span>
                </CardTitle>
                <CardDescription>
                  Most borrowed this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularBooks.map((book, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/20 smooth-transition">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {book.author}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                         <Badge variant="secondary" className="text-xs">
                           {(book as any).count}
                         </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                    <span>View Full Analytics</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <IssueBookDialog
        open={issueBookOpen}
        onOpenChange={setIssueBookOpen}
        onBookIssued={fetchDashboardData}
      />

      <QuickActionsDialog
        open={quickActionsOpen}
        onOpenChange={setQuickActionsOpen}
        onActionComplete={fetchDashboardData}
      />

      <ReportGenerator
        open={reportGeneratorOpen}
        onOpenChange={setReportGeneratorOpen}
      />
    </div>
  );
};