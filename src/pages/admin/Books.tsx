import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AddBookDialog } from "@/components/admin/AddBookDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  RefreshCw,
  ScanLine,
  Upload
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  description: string | null;
  publication_year: number | null;
  total_copies: number;
  available_copies: number;
  location_shelf: string | null;
  cover_image_url: string | null;
  created_at: string;
}

export const Books = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBookOpen, setAddBookOpen] = useState(false);

  const categories = [
    "Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry",
    "Biology", "Literature", "History", "Philosophy", "Psychology",
    "Business", "Economics", "Art", "Music", "Sports", "Fiction",
    "Non-Fiction", "Reference", "Textbook", "Research"
  ];

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      toast({
        title: "Error Loading Books",
        description: "Could not fetch books from the database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || book.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getBookStatus = (book: Book) => {
    if (book.available_copies === 0) return { status: "Out of Stock", variant: "destructive" as const };
    if (book.available_copies <= book.total_copies * 0.2) return { status: "Low Stock", variant: "secondary" as const };
    return { status: "Available", variant: "default" as const };
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Book Deleted",
        description: "Book has been removed from the library",
      });

      fetchBooks();
    } catch (error) {
      toast({
        title: "Error Deleting Book",
        description: "Could not delete the book",
        variant: "destructive"
      });
    }
  };

  const exportBooks = () => {
    const csvContent = [
      ["Title", "Author", "ISBN", "Category", "Publisher", "Year", "Total Copies", "Available", "Shelf"],
      ...filteredBooks.map(book => [
        book.title,
        book.author,
        book.isbn || "",
        book.category || "",
        book.publisher || "",
        book.publication_year || "",
        book.total_copies,
        book.available_copies,
        book.location_shelf || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-books-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Smart Book Management</h1>
            <p className="text-muted-foreground">
              Modern library system - Better than Koha with AI-powered features
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => fetchBooks()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setAddBookOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Books</p>
                  <p className="text-2xl font-bold">{books.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {books.reduce((sum, book) => sum + book.available_copies, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Borrowed</p>
                  <p className="text-2xl font-bold">
                    {books.reduce((sum, book) => sum + (book.total_copies - book.available_copies), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">
                    {new Set(books.map(book => book.category).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title, author, ISBN, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={exportBooks}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
              <p className="text-muted-foreground mb-4">
                {books.length === 0 
                  ? "No books in the library yet. Add your first book to get started."
                  : "No books match your current search criteria."
                }
              </p>
              {books.length === 0 && (
                <Button onClick={() => setAddBookOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Book
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const { status, variant } = getBookStatus(book);
              return (
                <Card key={book.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-muted rounded border flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <Badge variant={variant}>{status}</Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
                    <CardDescription>by {book.author}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm mb-4">
                      {book.isbn && (
                        <p><span className="font-medium">ISBN:</span> {book.isbn}</p>
                      )}
                      {book.category && (
                        <p><span className="font-medium">Category:</span> {book.category}</p>
                      )}
                      {book.publisher && (
                        <p><span className="font-medium">Publisher:</span> {book.publisher}</p>
                      )}
                      {book.publication_year && (
                        <p><span className="font-medium">Year:</span> {book.publication_year}</p>
                      )}
                      {book.location_shelf && (
                        <p><span className="font-medium">Shelf:</span> {book.location_shelf}</p>
                      )}
                      <p>
                        <span className="font-medium">Copies:</span> 
                        <span className="ml-1">{book.available_copies}/{book.total_copies} available</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteBook(book.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddBookDialog
        open={addBookOpen}
        onOpenChange={setAddBookOpen}
        onBookAdded={fetchBooks}
      />
    </div>
  );
};