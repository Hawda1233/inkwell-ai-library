import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Search, 
  Upload, 
  Scan, 
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAdded: () => void;
}

interface BookData {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  description: string;
  publication_year: string;
  total_copies: string;
  location_shelf: string;
  cover_image_url: string;
}

export const AddBookDialog = ({ open, onOpenChange, onBookAdded }: AddBookDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchingISBN, setSearchingISBN] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [bookData, setBookData] = useState<BookData>({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    category: "",
    description: "",
    publication_year: "",
    total_copies: "1",
    location_shelf: "",
    cover_image_url: ""
  });

  const categories = [
    "Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry",
    "Biology", "Literature", "History", "Philosophy", "Psychology",
    "Business", "Economics", "Art", "Music", "Sports", "Fiction",
    "Non-Fiction", "Reference", "Textbook", "Research"
  ];

  const updateBookData = (field: keyof BookData, value: string) => {
    setBookData(prev => ({ ...prev, [field]: value }));
  };

  const searchByISBN = async () => {
    if (!bookData.isbn) {
      toast({
        title: "ISBN Required",
        description: "Please enter an ISBN to search",
        variant: "destructive"
      });
      return;
    }

    setSearchingISBN(true);
    try {
      // Google Books API search
      const API_KEY = "AIzaSyAEbCZLWIP2PIcJrCKwr06EGtVVHiebvvg";
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${bookData.isbn}&key=${API_KEY}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        
        setBookData(prev => ({
          ...prev,
          title: book.title || prev.title,
          author: book.authors ? book.authors.join(", ") : prev.author,
          publisher: book.publisher || prev.publisher,
          description: book.description || prev.description,
          publication_year: book.publishedDate ? book.publishedDate.split("-")[0] : prev.publication_year,
          cover_image_url: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || prev.cover_image_url,
          category: book.categories ? book.categories[0] : prev.category
        }));
        
        toast({
          title: "Book Found!",
          description: "Book details have been automatically filled",
        });
      } else {
        toast({
          title: "Book Not Found",
          description: "No book found with this ISBN",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not search for book details",
        variant: "destructive"
      });
    } finally {
      setSearchingISBN(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      // For now, we'll use a placeholder URL. In a real implementation,
      // you'd upload to Supabase Storage or another service
      const imageUrl = URL.createObjectURL(file);
      updateBookData('cover_image_url', imageUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Cover image has been set successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!bookData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a book title",
        variant: "destructive"
      });
      return false;
    }
    
    if (!bookData.author.trim()) {
      toast({
        title: "Author Required", 
        description: "Please enter the author name",
        variant: "destructive"
      });
      return false;
    }

    if (bookData.total_copies && parseInt(bookData.total_copies) < 1) {
      toast({
        title: "Invalid Copies",
        description: "Total copies must be at least 1",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .insert([{
          title: bookData.title.trim(),
          author: bookData.author.trim(),
          isbn: bookData.isbn.trim() || null,
          publisher: bookData.publisher.trim() || null,
          category: bookData.category || null,
          description: bookData.description.trim() || null,
          publication_year: bookData.publication_year ? parseInt(bookData.publication_year) : null,
          total_copies: parseInt(bookData.total_copies) || 1,
          available_copies: parseInt(bookData.total_copies) || 1,
          location_shelf: bookData.location_shelf.trim() || null,
          cover_image_url: bookData.cover_image_url || null
        }]);

      if (error) throw error;

      toast({
        title: "Book Added Successfully",
        description: `"${bookData.title}" has been added to the library`,
      });

      // Reset form
      setBookData({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        category: "",
        description: "",
        publication_year: "",
        total_copies: "1",
        location_shelf: "",
        cover_image_url: ""
      });

      onBookAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Add Book",
        description: "There was an error adding the book to the library",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Add New Book to Library
          </DialogTitle>
          <DialogDescription>
            Add books manually, search by ISBN, or use bulk import. Better than traditional library systems.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="isbn" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              ISBN Search
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter book title"
                    value={bookData.title}
                    onChange={(e) => updateBookData('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name(s)"
                    value={bookData.author}
                    onChange={(e) => updateBookData('author', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <div className="flex gap-2">
                    <Input
                      id="isbn"
                      placeholder="Enter ISBN"
                      value={bookData.isbn}
                      onChange={(e) => updateBookData('isbn', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchByISBN}
                      disabled={searchingISBN || !bookData.isbn}
                    >
                      {searchingISBN ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    placeholder="Enter publisher"
                    value={bookData.publisher}
                    onChange={(e) => updateBookData('publisher', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={bookData.category} onValueChange={(value) => updateBookData('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publication_year">Publication Year</Label>
                  <Input
                    id="publication_year"
                    type="number"
                    placeholder="YYYY"
                    value={bookData.publication_year}
                    onChange={(e) => updateBookData('publication_year', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_copies">Total Copies</Label>
                  <Input
                    id="total_copies"
                    type="number"
                    min="1"
                    value={bookData.total_copies}
                    onChange={(e) => updateBookData('total_copies', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_shelf">Shelf Location</Label>
                  <Input
                    id="location_shelf"
                    placeholder="e.g., A-1, B-23, CS-101"
                    value={bookData.location_shelf}
                    onChange={(e) => updateBookData('location_shelf', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_image">Cover Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cover_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('cover_image')?.click()}
                      disabled={uploadingImage}
                      className="flex-1"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 mr-2" />
                      )}
                      Upload Cover
                    </Button>
                    {bookData.cover_image_url && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  {bookData.cover_image_url && (
                    <div className="mt-2">
                      <img
                        src={bookData.cover_image_url}
                        alt="Book cover"
                        className="w-20 h-28 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter book description or summary"
                value={bookData.description}
                onChange={(e) => updateBookData('description', e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="isbn" className="space-y-6 mt-6">
            <div className="text-center py-8">
              <Scan className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quick ISBN Search</h3>
              <p className="text-muted-foreground mb-6">
                Enter an ISBN to automatically fetch book details from Google Books
              </p>
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ISBN (10 or 13 digits)"
                    value={bookData.isbn}
                    onChange={(e) => updateBookData('isbn', e.target.value)}
                  />
                  <Button onClick={searchByISBN} disabled={searchingISBN || !bookData.isbn}>
                    {searchingISBN ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  After searching, you can edit any details before adding
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6 mt-6">
            <div className="text-center py-8">
              <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bulk Import (Coming Soon)</h3>
              <p className="text-muted-foreground mb-6">
                Import multiple books from CSV files with automatic validation
              </p>
              
              <div className="space-y-4">
                <Button variant="outline" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV File
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>Supported format: Title, Author, ISBN, Publisher, Category, Copies</p>
                  <p>This feature will be available in the next update</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Book...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Add Book
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};