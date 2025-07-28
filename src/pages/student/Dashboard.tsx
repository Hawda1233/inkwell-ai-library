import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Download,
  QrCode,
  Search,
  Star,
  AlertCircle,
  CheckCircle2,
  BookmarkPlus
} from "lucide-react";

export const StudentDashboard = () => {
  const issuedBooks = [
    {
      title: "Data Structures and Algorithms",
      author: "Thomas H. Cormen",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      status: "active",
      daysLeft: 12,
      renewals: 1,
      maxRenewals: 2
    },
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      issueDate: "2024-01-20",
      dueDate: "2024-02-20",
      status: "active",
      daysLeft: 17,
      renewals: 0,
      maxRenewals: 2
    },
    {
      title: "Operating System Concepts",
      author: "Abraham Silberschatz",
      issueDate: "2024-01-10",
      dueDate: "2024-02-10",
      status: "overdue",
      daysLeft: -3,
      renewals: 2,
      maxRenewals: 2
    }
  ];

  const recommendations = [
    {
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      category: "Computer Science",
      rating: 4.8,
      available: true
    },
    {
      title: "Design Patterns",
      author: "Gang of Four",
      category: "Software Engineering",
      rating: 4.7,
      available: true
    },
    {
      title: "Computer Networks",
      author: "Andrew S. Tanenbaum",
      category: "Networking",
      rating: 4.6,
      available: false
    }
  ];

  const stats = {
    totalIssued: 3,
    totalRead: 47,
    currentFines: 150,
    favoriteGenre: "Computer Science"
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="student" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, Arjun! 👋
            </h1>
            <p className="text-muted-foreground">
              Track your books, discover new reads, and manage your library account.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>My Library ID</span>
            </Button>
            <Button variant="academic" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="library-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalIssued}</p>
                  <p className="text-xs text-muted-foreground">Current Books</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="library-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRead}</p>
                  <p className="text-xs text-muted-foreground">Books Read</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="library-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{stats.currentFines}</p>
                  <p className="text-xs text-muted-foreground">Pending Fines</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="library-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{stats.favoriteGenre}</p>
                  <p className="text-xs text-muted-foreground">Favorite Genre</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Issued Books */}
          <div className="lg:col-span-2">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>My Issued Books</span>
                </CardTitle>
                <CardDescription>
                  Books currently checked out to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issuedBooks.map((book, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 hover:bg-secondary/20 smooth-transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h4 className="font-semibold text-foreground mb-1">{book.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Issued: {new Date(book.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Due: {new Date(book.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {book.status === 'overdue' ? (
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="destructive" className="text-xs">
                                Overdue by {Math.abs(book.daysLeft)} days
                              </Badge>
                              <span className="text-xs text-red-600">Fine: ₹{Math.abs(book.daysLeft) * 5}</span>
                            </div>
                          ) : (
                            <div className="mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {book.daysLeft} days remaining
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs text-muted-foreground">
                              Renewals: {book.renewals}/{book.maxRenewals}
                            </span>
                            <Progress 
                              value={(book.renewals / book.maxRenewals) * 100} 
                              className="h-1 w-20"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {book.renewals < book.maxRenewals && book.status !== 'overdue' && (
                            <Button variant="outline" size="sm">
                              Renew
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Library Limit: 5 books</span>
                    <span className="text-foreground font-medium">
                      {issuedBooks.length}/5 books issued
                    </span>
                  </div>
                  <Progress value={(issuedBooks.length / 5) * 100} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-1">
            <Card className="library-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Recommended for You</span>
                </CardTitle>
                <CardDescription>
                  Based on your reading history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((book, index) => (
                    <div key={index} className="border border-border rounded-lg p-3 hover:bg-secondary/20 smooth-transition">
                      <h4 className="font-medium text-foreground text-sm mb-1">{book.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          {book.category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">{book.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={book.available ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {book.available ? "Available" : "Unavailable"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <BookmarkPlus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="w-full" size="sm">
                    View More Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};