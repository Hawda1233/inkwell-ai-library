import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Download,
  Calendar,
  Clock,
  Target
} from "lucide-react";

export const Analytics = () => {
  const stats = [
    {
      title: "Total Books",
      value: "2,847",
      change: "+12%",
      trend: "up",
      icon: BookOpen
    },
    {
      title: "Active Students",
      value: "1,234",
      change: "+8%", 
      trend: "up",
      icon: Users
    },
    {
      title: "Books Issued Today",
      value: "47",
      change: "+23%",
      trend: "up", 
      icon: TrendingUp
    },
    {
      title: "Overdue Books",
      value: "15",
      change: "-5%",
      trend: "down",
      icon: Clock
    }
  ];

  const popularBooks = [
    { title: "Introduction to Algorithms", borrowed: 45, category: "Computer Science" },
    { title: "Modern Physics", borrowed: 38, category: "Physics" },
    { title: "Digital Marketing", borrowed: 32, category: "Business" },
    { title: "Data Structures", borrowed: 28, category: "Computer Science" },
    { title: "Calculus", borrowed: 25, category: "Mathematics" }
  ];

  const recentActivity = [
    { action: "Book Issued", student: "Alice Johnson", book: "Python Programming", time: "2 hours ago" },
    { action: "Book Returned", student: "Bob Smith", book: "Database Systems", time: "3 hours ago" },
    { action: "New Registration", student: "Carol Davis", book: "-", time: "5 hours ago" },
    { action: "Book Renewed", student: "David Wilson", book: "Linear Algebra", time: "1 day ago" }
  ];

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
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
                  {" "}from last month
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
                Books with highest borrowing frequency this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.category}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {book.borrowed} times
                    </Badge>
                  </div>
                ))}
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
                {recentActivity.map((activity, index) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholder */}
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
                <p className="text-muted-foreground">Chart visualization coming soon</p>
                <p className="text-sm text-muted-foreground">Integration with recharts in progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};