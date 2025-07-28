import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Eye
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
  isbn?: string;
  total_copies: number;
  available_copies: number;
  category?: string;
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
    return 'students'; // default
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
    navigate(`/admin/${value === 'students' ? 'students' : value}`);
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

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents.toString(),
      change: "Registered users",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Total Books",
      value: stats.totalBooks.toString(),
      change: "In catalog",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Active Loans",
      value: stats.activeTransactions.toString(),
      change: "Currently borrowed",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Overdue Books",
      value: stats.overdueBooks.toString(),
      change: "Need attention",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 academic-gradient rounded-xl flex items-center justify-center">
                <Library className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Portal</h1>
                <p className="text-sm text-muted-foreground">SmartLibrary Management</p>
              </div>
            </div>
            <Button 
              onClick={handleSignOut}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="glass-card"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoading ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Library Management Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage students, books, and transactions efficiently
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students, books, or transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Management
                </CardTitle>
                <CardDescription>
                  View and manage registered students and their digital IDs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStudents.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{student.full_name || "No name"}</h4>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                            {student.digital_id && (
                              <span>ID: {student.digital_id.student_number}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No students found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Book Transactions
                </CardTitle>
                <CardDescription>
                  Manage book borrowing, returns, and renewals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTransactions.slice(0, 15).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{transaction.book.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {transaction.book.author}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Student: {transaction.student.full_name}</span>
                            <span>
                              {transaction.transaction_type === 'borrow' ? 'Borrowed' : 
                               transaction.transaction_type === 'return' ? 'Returned' : 'Renewed'}: 
                              {' '}{new Date(transaction.transaction_date).toLocaleDateString()}
                            </span>
                            {transaction.due_date && (
                              <span>Due: {new Date(transaction.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              transaction.status === 'active' ? 'default' :
                              transaction.status === 'returned' ? 'secondary' :
                              transaction.status === 'overdue' ? 'destructive' : 'outline'
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
                            >
                              Mark Returned
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Book Catalog
                </CardTitle>
                <CardDescription>
                  Manage library book inventory and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredBooks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBooks.slice(0, 15).map((book) => (
                      <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{book.title}</h4>
                          <p className="text-sm text-muted-foreground">by {book.author}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                            {book.category && <span>Category: {book.category}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <p className="font-medium">
                              {book.available_copies}/{book.total_copies} available
                            </p>
                            <Badge 
                              variant={book.available_copies > 0 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {book.available_copies > 0 ? "Available" : "Not Available"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Library className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No books found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Library Analytics
                </CardTitle>
                <CardDescription>
                  View detailed reports and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting features coming soon!
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