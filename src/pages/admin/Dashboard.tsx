import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
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
  BarChart3
} from "lucide-react";

export const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Books",
      value: "12,847",
      change: "+127 this month",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Active Students",
      value: "3,452",
      change: "+89 this week",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Books Issued",
      value: "1,247",
      change: "+23 today",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    },
    {
      title: "Overdue Items",
      value: "89",
      change: "-12 from yesterday",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950"
    }
  ];

  const recentActivities = [
    {
      type: "issue",
      student: "Arjun Sharma",
      book: "Data Structures and Algorithms",
      time: "2 minutes ago",
      status: "issued"
    },
    {
      type: "return",
      student: "Priya Patel",
      book: "Machine Learning Basics",
      time: "15 minutes ago",
      status: "returned"
    },
    {
      type: "overdue",
      student: "Rahul Kumar",
      book: "Database Management Systems",
      time: "1 hour ago",
      status: "overdue"
    },
    {
      type: "registration",
      student: "Sneha Gupta",
      book: "New student registration",
      time: "2 hours ago",
      status: "registered"
    }
  ];

  const popularBooks = [
    { title: "Introduction to Algorithms", author: "Thomas H. Cormen", issued: 47 },
    { title: "Clean Code", author: "Robert C. Martin", issued: 42 },
    { title: "Design Patterns", author: "Gang of Four", issued: 38 },
    { title: "Operating System Concepts", author: "Abraham Silberschatz", issued: 35 },
    { title: "Computer Networks", author: "Andrew S. Tanenbaum", issued: 31 }
  ];

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
            <Button variant="outline" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Generate Report</span>
            </Button>
            <Button variant="academic" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Quick Actions</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
                          {book.issued}
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
    </div>
  );
};