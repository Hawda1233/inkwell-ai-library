import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Library, 
  BookOpen, 
  Users, 
  TrendingUp,
  LogOut,
  QrCode,
  Search,
  Plus,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  ArrowRight,
  BarChart3,
  Award,
  BookMarked
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string | null;
  digital_id?: {
    student_number: string;
    issued_at: string;
    is_active: boolean;
  };
}

interface BookTransaction {
  id: string;
  student_id: string;
  book_id: string;
  transaction_type: string;
  transaction_date: string;
  due_date?: string | null;
  returned_date?: string | null;
  status: string;
  notes?: string | null;
  processed_by?: string | null;
  student: {
    email: string;
    full_name: string | null;
  };
  book: {
    title: string;
    author: string;
    isbn?: string | null;
  };
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  total_copies: number;
  available_copies: number;
  category?: string | null;
  location_shelf?: string | null;
}

export const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<BookTransaction[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBooks: 0,
    activeTransactions: 0,
    overdueBooks: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/students')) return 'students';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/books')) return 'books';
    if (path.includes('/reports')) return 'reports';
    return 'overview'; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch students with their digital IDs
      const { data: studentsData } = await supabase
        .from('profiles')
        .select(`
          *,
          digital_id:student_digital_ids(student_number, issued_at, is_active)
        `)
        .order('created_at', { ascending: false });

      if (studentsData) {
        const formattedStudents = studentsData.map((student: any) => ({
          id: student.id,
          email: student.email,
          full_name: student.full_name,
          created_at: student.created_at,
          updated_at: student.updated_at,
          digital_id: student.digital_id?.[0] || undefined
        })) as Student[];
        
        setStudents(formattedStudents);
        setStats(prev => ({ ...prev, totalStudents: studentsData.length }));
      }

      // Fetch all book transactions
      const { data: transactionsData } = await supabase
        .from('book_transactions')
        .select(`
          *,
          student:profiles!book_transactions_student_id_fkey(email, full_name),
          book:books(title, author, isbn)
        `)
        .order('transaction_date', { ascending: false });

      if (transactionsData) {
        const formattedTransactions = transactionsData.filter((t: any) => 
          t.student && typeof t.student === 'object' && t.student.email
        ).map((transaction: any) => ({
          id: transaction.id,
          student_id: transaction.student_id,
          book_id: transaction.book_id,
          transaction_type: transaction.transaction_type,
          transaction_date: transaction.transaction_date,
          due_date: transaction.due_date,
          returned_date: transaction.returned_date,
          status: transaction.status,
          notes: transaction.notes,
          processed_by: transaction.processed_by,
          student: transaction.student,
          book: transaction.book
        })) as BookTransaction[];
        
        setTransactions(formattedTransactions);
        const activeCount = formattedTransactions.filter(t => t.status === 'active').length;
        const overdueCount = formattedTransactions.filter(t => t.status === 'overdue').length;
        setStats(prev => ({ 
          ...prev, 
          activeTransactions: activeCount,
          overdueBooks: overdueCount
        }));
      }

      // Fetch all books
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      if (booksData) {
        setBooks(booksData);
        setStats(prev => ({ ...prev, totalBooks: booksData.length }));
      }

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('book_transactions')
        .update({
          status: 'returned',
          returned_date: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Book returned successfully",
        description: "The book has been marked as returned.",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error returning book",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'overview') {
      navigate('/admin');
    } else {
      navigate(`/admin/${value}`);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.digital_id?.student_number?.includes(searchTerm)
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.includes(searchTerm)
  );

  const recentActivities = [
    {
      id: 1,
      action: "Book Issued",
      details: "Clean Code issued to Alice Smith",
      time: "2 hours ago",
      type: "issue",
      icon: BookOpen
    },
    {
      id: 2,
      action: "Book Returned",
      details: "The Great Gatsby returned by Bob Johnson",
      time: "4 hours ago",
      type: "return",
      icon: CheckCircle
    },
    {
      id: 3,
      action: "New Registration",
      details: "Carol Williams registered as student",
      time: "1 day ago",
      type: "registration",
      icon: UserCheck
    },
    {
      id: 4,
      action: "Overdue Alert",
      details: "Design Patterns overdue by 3 days",
      time: "2 days ago",
      type: "overdue",
      icon: AlertCircle
    }
  ];

  const popularBooks = [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      issueCount: 15,
      category: "Technology",
      availability: "Available"
    },
    {
      title: "The Pragmatic Programmer",
      author: "David Thomas",
      issueCount: 12,
      category: "Technology",
      availability: "Available"
    },
    {
      title: "Design Patterns",
      author: "Gang of Four",
      issueCount: 10,
      category: "Technology", 
      availability: "Unavailable"
    },
    {
      title: "JavaScript: The Good Parts",
      author: "Douglas Crockford",
      issueCount: 8,
      category: "Technology",
      availability: "Available"
    }
  ];

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks.toString(),
      change: "+12 this month",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Active Students", 
      value: stats.totalStudents.toString(),
      change: "+89 this week",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Books Issued",
      value: stats.activeTransactions.toString(),
      change: "+23 today",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    },
    {
      title: "Overdue Items",
      value: stats.overdueBooks.toString(),
      change: "-12 from yesterday",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 academic-gradient rounded-2xl flex items-center justify-center glow-effect">
                <Library className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">SmartLibrary Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="library-card hover-scale">
                <Plus className="w-4 h-4 mr-2" />
                Add Book
              </Button>
              <Button 
                onClick={handleSignOut}
                disabled={isLoading}
                variant="ghost"
                className="library-card"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Admin! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening in your library today.
          </p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="library-card hover-scale animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, books, or transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 library-card"
            />
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 library-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <Card className="library-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Recent Activities</span>
                  </CardTitle>
                  <CardDescription>Latest library transactions and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-secondary/20 smooth-transition">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'issue' ? 'bg-blue-50 dark:bg-blue-950' :
                          activity.type === 'return' ? 'bg-green-50 dark:bg-green-950' :
                          activity.type === 'registration' ? 'bg-purple-50 dark:bg-purple-950' :
                          'bg-red-50 dark:bg-red-950'
                        }`}>
                          <activity.icon className={`w-5 h-5 ${
                            activity.type === 'issue' ? 'text-blue-600' :
                            activity.type === 'return' ? 'text-green-600' :
                            activity.type === 'registration' ? 'text-purple-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      View All Activities
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Books */}
              <Card className="library-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Popular Books</span>
                  </CardTitle>
                  <CardDescription>Most frequently issued books this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularBooks.map((book, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 smooth-transition">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 academic-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{book.title}</p>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                            <p className="text-xs text-muted-foreground">{book.issueCount} times issued</p>
                          </div>
                        </div>
                        <Badge variant={book.availability === "Available" ? "secondary" : "destructive"} className="text-xs">
                          {book.availability}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      View Full Analytics
                      <BarChart3 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Management ({filteredStudents.length})
                </CardTitle>
                <CardDescription>
                  View and manage registered students and their digital IDs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStudents.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStudents.map((student, index) => (
                      <div key={student.id} 
                           className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 smooth-transition animate-fade-in"
                           style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 academic-gradient rounded-xl flex items-center justify-center text-white font-bold">
                            {(student.full_name || student.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{student.full_name || "No name"}</h4>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                              {student.digital_id && (
                                <span>ID: {student.digital_id.student_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {student.digital_id ? (
                            <Badge variant="secondary" className="text-xs">
                              <QrCode className="w-3 h-3 mr-1" />
                              Digital ID Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              No Digital ID
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="hover-scale">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
                    <p className="text-muted-foreground">Try adjusting your search criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5" />
                  Transaction Management ({filteredTransactions.length})
                </CardTitle>
                <CardDescription>
                  Manage book borrowing, returns, and renewals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTransactions.slice(0, 10).map((transaction, index) => (
                      <div key={transaction.id} 
                           className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 smooth-transition animate-fade-in"
                           style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            transaction.status === 'active' ? 'bg-blue-50 dark:bg-blue-950' :
                            transaction.status === 'returned' ? 'bg-green-50 dark:bg-green-950' :
                            'bg-red-50 dark:bg-red-950'
                          }`}>
                            <BookOpen className={`w-6 h-6 ${
                              transaction.status === 'active' ? 'text-blue-600' :
                              transaction.status === 'returned' ? 'text-green-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{transaction.book.title}</h4>
                            <p className="text-sm text-muted-foreground">by {transaction.book.author}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Student: {transaction.student.full_name}</span>
                              <span>
                                {transaction.transaction_type === 'borrow' ? 'Borrowed' : 'Returned'}: 
                                {' '}{new Date(transaction.transaction_date).toLocaleDateString()}
                              </span>
                              {transaction.due_date && (
                                <span>Due: {new Date(transaction.due_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={
                              transaction.status === 'active' ? 'default' :
                              transaction.status === 'returned' ? 'secondary' :
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                          {transaction.status === 'active' && (
                            <Button 
                              onClick={() => handleReturnBook(transaction.id)}
                              variant="outline" 
                              size="sm"
                              className="hover-scale"
                            >
                              Mark Returned
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
                    <p className="text-muted-foreground">No book transactions match your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-4">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Book Catalog ({filteredBooks.length})
                </CardTitle>
                <CardDescription>
                  Manage library book inventory and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredBooks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBooks.slice(0, 12).map((book, index) => (
                      <div key={book.id} 
                           className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/20 smooth-transition animate-fade-in"
                           style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 academic-gradient rounded-xl flex items-center justify-center text-white font-bold">
                            {book.title.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{book.title}</h4>
                            <p className="text-sm text-muted-foreground">by {book.author}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              {book.isbn && <span>ISBN: {book.isbn}</span>}
                              {book.category && <span>Category: {book.category}</span>}
                              {book.location_shelf && <span>Location: {book.location_shelf}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {book.available_copies}/{book.total_copies}
                            </p>
                            <p className="text-xs text-muted-foreground">available</p>
                          </div>
                          <Badge 
                            variant={book.available_copies > 0 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {book.available_copies > 0 ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No books found</h3>
                    <p className="text-muted-foreground">No books match your search criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics & Reports
                </CardTitle>
                <CardDescription>
                  Comprehensive library analytics and reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <div className="w-20 h-20 academic-gradient rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Detailed reports including usage patterns, popular books, student activity, and performance metrics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};