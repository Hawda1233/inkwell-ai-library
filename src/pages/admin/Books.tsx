import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Plus, Filter, Download } from "lucide-react";

export const Books = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const books = [
    {
      id: 1,
      title: "Introduction to Computer Science",
      author: "John Smith",
      isbn: "978-0123456789",
      category: "Technology",
      status: "Available",
      copies: 15,
      available: 12
    },
    {
      id: 2,
      title: "Modern Physics",
      author: "Dr. Sarah Johnson",
      isbn: "978-0987654321",
      category: "Science",
      status: "Available",
      copies: 8,
      available: 5
    },
    {
      id: 3,
      title: "Digital Marketing Fundamentals",
      author: "Michael Brown",
      isbn: "978-0456789123",
      category: "Business",
      status: "Low Stock",
      copies: 3,
      available: 1
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Books Management</h1>
            <p className="text-muted-foreground">Manage your library collection</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Book
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <Badge variant={book.status === "Available" ? "default" : "destructive"}>
                    {book.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <CardDescription>by {book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ISBN:</span> {book.isbn}</p>
                  <p><span className="font-medium">Category:</span> {book.category}</p>
                  <p>
                    <span className="font-medium">Availability:</span> 
                    <span className="ml-1">{book.available}/{book.copies} copies</span>
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};