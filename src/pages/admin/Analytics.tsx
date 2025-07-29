import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Download,
  Calendar,
  Clock,
  Target,
  RefreshCw
} from "lucide-react";

export const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeStudents: 0,
    booksIssuedToday: 0,
    overdueBooks: 0
  });
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch total books
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id');
      if (booksError) throw booksError;

      // Fetch active students
      const { data: students, error: studentsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      if (studentsError) throw studentsError;

      // Fetch books issued today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayTransactions, error: todayError } = await supabase
        .from('book_transactions')
        .select('id')
        .eq('transaction_type', 'borrow')
        .gte('transaction_date', today.toISOString());
      if (todayError) throw todayError;

      // Fetch overdue books
      const { data: overdueTransactions, error: overdueError } = await supabase
        .from('book_transactions')
        .select('id')
        .eq('status', 'active')
        .lt('due_date', new Date().toISOString());
      if (overdueError) throw overdueError;

      // Fetch popular books
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('book_transactions')
        .select(`
          book_id,
          books(title, category)
        `)
        .eq('transaction_type', 'borrow');
      if (transactionsError) throw transactionsError;

      // Count borrowings per book
      const bookCounts = allTransactions?.reduce((acc: any, transaction) => {
        const bookId = transaction.book_id;
        if (!acc[bookId]) {
          acc[bookId] = {
            title: transaction.books?.title || 'Unknown',
            category: transaction.books?.category || 'Unknown',
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

      // Fetch recent activity
      const { data: recentTransactions, error: recentError } = await supabase
        .from('book_transactions')
        .select(`
          *,
          books(title)
        `)
        .order('transaction_date', { ascending: false })
        .limit(10);
      if (recentError) throw recentError;

      // Process recent activity
      const processedActivity = recentTransactions?.map(transaction => {
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
          action: transaction.transaction_type === 'borrow' ? 'Book Issued' : 'Book Returned',
          student: `Student ${transaction.student_id.slice(0, 8)}`,
          book: transaction.books?.title || 'Unknown Book',
          time: timeString
        };
      }) || [];

      setStats({
        totalBooks: books?.length || 0,
        activeStudents: students?.length || 0,
        booksIssuedToday: todayTransactions?.length || 0,
        overdueBooks: overdueTransactions?.length || 0
      });

      setPopularBooks(topBooks);
      setRecentActivity(processedActivity);

    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Could not fetch analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();

    // Set up real-time subscriptions
    const transactionChannel = supabase
      .channel('analytics-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_transactions'
        },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();

    const booksChannel = supabase
      .channel('analytics-books')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books'
        },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(booksChannel);
    };
  }, []);

  const exportReport = () => {
    const csvContent = [
      ["Metric", "Value", "Date"],
      ["Total Books", stats.totalBooks, new Date().toLocaleDateString()],
      ["Active Students", stats.activeStudents, new Date().toLocaleDateString()],
      ["Books Issued Today", stats.booksIssuedToday, new Date().toLocaleDateString()],
      ["Overdue Books", stats.overdueBooks, new Date().toLocaleDateString()],
      [""],
      ["Popular Books", "", ""],
      ...popularBooks.map((book: any, index) => [
        `${index + 1}. ${book.title}`,
        `${book.count} times borrowed`,
        book.category
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statsData = [
    {
      title: "Total Books",
      value: stats.totalBooks.toLocaleString(),
      change: "Live data",
      trend: "up",
      icon: BookOpen
    },
    {
      title: "Active Students",
      value: stats.activeStudents.toLocaleString(),
      change: "Registered users", 
      trend: "up",
      icon: Users
    },
    {
      title: "Books Issued Today",
      value: stats.booksIssuedToday.toLocaleString(),
      change: "Today's activity",
      trend: "up", 
      icon: TrendingUp
    },
    {
      title: "Overdue Books",
      value: stats.overdueBooks.toLocaleString(),
      change: "Need attention",
      trend: stats.overdueBooks > 0 ? "up" : "down",
      icon: Clock
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation userRole="admin" />
        <div className="max-w-7xl mx-auto p-6">
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
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track library performance and usage statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={fetchAnalyticsData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={exportReport}>
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Most Popular Books
              </CardTitle>
              <CardDescription>
                Books with highest borrowing frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularBooks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No borrowing data available yet
                  </p>
                ) : (
                  popularBooks.map((book: any, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.category}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {book.count} times
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest library transactions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {activity.action}
                          {activity.book !== "-" && (
                            <span className="text-muted-foreground"> - {activity.book}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.student}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {activity.time}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Trends - Real Chart Integration Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Usage Trends
            </CardTitle>
            <CardDescription>
              Monthly book borrowing and return statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Real-time charts coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Will show trends based on your actual library data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};