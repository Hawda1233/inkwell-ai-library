import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Library, 
  BookOpen, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  LogOut,
  QrCode,
  User,
  Calendar,
  Download,
  Search,
  Star,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";

interface DigitalId {
  id: string;
  student_number: string;
  qr_code_data: string;
  issued_at: string;
  is_active: boolean;
}

interface BookTransaction {
  id: string;
  books?: {
    title: string;
    author: string;
    isbn?: string;
  };
  transaction_type: string;
  transaction_date: string;
  due_date?: string;
  status: string;
}

interface LibrarySession {
  id: string;
  check_in_time: string;
  check_out_time?: string;
  session_status: string;
  purpose?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  category?: string;
  description?: string;
  total_copies: number;
  available_copies: number;
  location_shelf?: string;
  cover_image_url?: string;
}

export const StudentDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [digitalId, setDigitalId] = useState<DigitalId | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [borrowedBooks, setBorrowedBooks] = useState<BookTransaction[]>([]);
  const [recentActivity, setRecentActivity] = useState<BookTransaction[]>([]);
  const [currentSession, setCurrentSession] = useState<LibrarySession | null>(null);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStudentProfile(profile);
      }

      // Fetch digital ID
      const { data: digitalIdData } = await supabase
        .from('student_digital_ids')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (digitalIdData) {
        setDigitalId(digitalIdData);
        // Generate QR code
        const qrUrl = await QRCode.toDataURL(digitalIdData.qr_code_data);
        setQrCodeUrl(qrUrl);
      }

      // Fetch borrowed books
      const { data: transactionsData } = await supabase
        .from('book_transactions')
        .select(`
          *,
          books(title, author, isbn)
        `)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .order('transaction_date', { ascending: false });

      if (transactionsData) {
        setBorrowedBooks(transactionsData);
      }

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('book_transactions')
        .select(`
          *,
          books(title, author, isbn)
        `)
        .eq('student_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (activityData) {
        setRecentActivity(activityData);
      }

      // Fetch current library session
      const { data: sessionData } = await supabase
        .from('library_sessions')
        .select('*')
        .eq('student_id', user.id)
        .eq('session_status', 'active')
        .single();

      if (sessionData) {
        setCurrentSession(sessionData);
      }

      // Fetch available books for browsing
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .gt('available_copies', 0)
        .order('created_at', { ascending: false });

      if (booksData) {
        setAvailableBooks(booksData);
      }

    } catch (error: any) {
      console.error('Error fetching student data:', error);
    }
  };

  const handleSignOut = async () => {
    // Check if student has any borrowed books before allowing sign out
    if (borrowedBooks.length > 0) {
      toast({
        title: "Cannot sign out",
        description: "Please return all borrowed books before signing out.",
        variant: "destructive",
      });
      return;
    }

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

  const handleLibraryCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('library_sessions')
        .insert([
          {
            student_id: user.id,
            purpose: 'study'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Checked in successfully",
        description: "Welcome to the library!",
      });

      fetchStudentData();
    } catch (error: any) {
      toast({
        title: "Error checking in",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLibraryCheckOut = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('library_sessions')
        .update({
          check_out_time: new Date().toISOString(),
          session_status: 'completed'
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      toast({
        title: "Checked out successfully",
        description: "Thank you for visiting the library!",
      });

      setCurrentSession(null);
    } catch (error: any) {
      toast({
        title: "Error checking out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !digitalId) return;

    const link = document.createElement('a');
    link.download = `student-id-${digitalId.student_number}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter books based on search and category
  const filteredBooks = availableBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.isbn?.includes(searchTerm);
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ["all", ...new Set(availableBooks.map(book => book.category).filter(Boolean))];

  const stats = [
    {
      label: "Books Borrowed",
      value: borrowedBooks.length.toString(),
      change: "Currently active",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Total Transactions",
      value: recentActivity.length.toString(),
      change: "All time",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Library Status",
      value: currentSession ? "Checked In" : "Not In Library",
      change: currentSession ? "Active session" : "Check in available",
      icon: CheckCircle,
      color: currentSession ? "text-green-600" : "text-gray-600",
      bgColor: currentSession ? "bg-green-50" : "bg-gray-50"
    },
    {
      label: "Student ID",
      value: digitalId?.student_number || "Loading...",
      change: "Digital ID ready",
      icon: QrCode,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
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
                <h1 className="text-xl font-bold text-foreground">Student Portal</h1>
                <p className="text-sm text-muted-foreground">SmartLibrary Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentSession ? (
                <Button 
                  onClick={handleLibraryCheckOut}
                  variant="outline"
                  size="sm"
                  className="glass-card"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out of Library
                </Button>
              ) : (
                <Button 
                  onClick={handleLibraryCheckIn}
                  variant="academic"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check In to Library
                </Button>
              )}
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {studentProfile?.full_name || 'Student'}!
          </h2>
          <p className="text-muted-foreground">
            Your digital library portal with QR ID and book management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="books" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="books">My Books</TabsTrigger>
            <TabsTrigger value="digitalid">Digital ID</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="browse">Browse Books</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Currently Borrowed Books
                </CardTitle>
                <CardDescription>
                  Books you have checked out from the library
                </CardDescription>
              </CardHeader>
              <CardContent>
                {borrowedBooks.length > 0 ? (
                  <div className="space-y-4">
                     {borrowedBooks.map((transaction) => (
                       <div key={transaction.id} className="flex items-start justify-between p-4 border rounded-lg">
                         <div className="space-y-1">
                           <h4 className="font-medium text-sm">{transaction.books?.title}</h4>
                           <p className="text-sm text-muted-foreground">{transaction.books?.author}</p>
                           <p className="text-xs text-muted-foreground">
                             Borrowed: {new Date(transaction.transaction_date).toLocaleDateString()}
                           </p>
                           {transaction.due_date && (
                             <p className={`text-xs ${new Date(transaction.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                               Due: {new Date(transaction.due_date).toLocaleDateString()}
                               {new Date(transaction.due_date) < new Date() && " (OVERDUE)"}
                             </p>
                           )}
                         </div>
                         <Badge 
                           variant={new Date(transaction.due_date || '') < new Date() ? "destructive" : "secondary"} 
                           className="text-xs"
                         >
                           {new Date(transaction.due_date || '') < new Date() ? 'overdue' : transaction.status}
                         </Badge>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No books currently borrowed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="digitalid" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Your Digital Student ID
                </CardTitle>
                <CardDescription>
                  Use this QR code for library check-ins and book borrowing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {digitalId && qrCodeUrl ? (
                  <div className="text-center space-y-6">
                    <div className="bg-white p-8 rounded-lg mx-auto inline-block shadow-lg">
                      <img 
                        src={qrCodeUrl} 
                        alt="Student QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="text-muted-foreground">Student Number:</p>
                          <p className="font-medium">{digitalId.student_number}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-muted-foreground">Issued:</p>
                          <p className="font-medium">
                            {new Date(digitalId.issued_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={downloadQRCode}
                        variant="outline"
                        className="mt-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading your digital ID...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent library transactions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'active' ? 'bg-blue-500' : 
                            activity.status === 'returned' ? 'bg-green-500' : 'bg-amber-500'
                          }`} />
                           <div>
                             <p className="text-sm font-medium">
                               {activity.transaction_type === 'borrow' ? 'Borrowed' : 
                                activity.transaction_type === 'return' ? 'Returned' : 'Renewed'} 
                               "{activity.books?.title}"
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {new Date(activity.transaction_date).toLocaleDateString()}
                             </p>
                           </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="w-5 h-5" />
                  Browse Library Catalog
                </CardTitle>
                <CardDescription>
                  Explore available books in the library - {filteredBooks.length} books available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search books, authors, or ISBN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Books Grid */}
                {filteredBooks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredBooks.map((book) => (
                      <div key={book.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                            <Badge variant="outline" className="text-xs ml-2">
                              {book.available_copies} available
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          {book.category && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-muted-foreground">{book.category}</span>
                            </div>
                          )}
                          {book.location_shelf && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-muted-foreground">Shelf: {book.location_shelf}</span>
                            </div>
                          )}
                          {book.publication_year && (
                            <p className="text-xs text-muted-foreground">Published: {book.publication_year}</p>
                          )}
                          {book.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{book.description}</p>
                          )}
                          <div className="pt-2">
                            <Button size="sm" variant="outline" className="w-full text-xs">
                              Request Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || selectedCategory !== "all" 
                        ? "No books found matching your criteria" 
                        : "No books available at the moment"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};