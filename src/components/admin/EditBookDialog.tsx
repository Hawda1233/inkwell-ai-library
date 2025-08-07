import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Loader2,
  CheckCircle,
  Trash2,
  AlertTriangle
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
  rack_number: string | null;
  row_shelf_number: string | null;
  cover_image_url: string | null;
  acquisition_date: string | null;
  accession_number: string | null;
  edition: string | null;
  pages: number | null;
  volume: string | null;
  source: string | null;
  bill_number: string | null;
  bill_date: string | null;
  cost: number | null;
  withdrawal_remarks: string | null;
}

interface EditBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookUpdated: () => void;
}

export const EditBookDialog = ({ book, open, onOpenChange, onBookUpdated }: EditBookDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    category: "",
    description: "",
    publication_year: "",
    total_copies: "",
    available_copies: "",
    location_shelf: "",
    rack_number: "",
    row_shelf_number: "",
    acquisition_date: "",
    accession_number: "",
    edition: "",
    pages: "",
    volume: "",
    source: "",
    bill_number: "",
    bill_date: "",
    cost: "",
    withdrawal_remarks: ""
  });

  const categories = [
    "Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry",
    "Biology", "Literature", "History", "Philosophy", "Psychology",
    "Business", "Economics", "Art", "Music", "Sports", "Fiction",
    "Non-Fiction", "Reference", "Textbook", "Research"
  ];

  useEffect(() => {
    if (book && open) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || "",
        publisher: book.publisher || "",
        category: book.category || "",
        description: book.description || "",
        publication_year: book.publication_year?.toString() || "",
        total_copies: book.total_copies.toString(),
        available_copies: book.available_copies.toString(),
        location_shelf: book.location_shelf || "",
        rack_number: book.rack_number || "",
        row_shelf_number: book.row_shelf_number || "",
        acquisition_date: book.acquisition_date || "",
        accession_number: book.accession_number || "",
        edition: book.edition || "",
        pages: book.pages?.toString() || "",
        volume: book.volume || "",
        source: book.source || "",
        bill_number: book.bill_number || "",
        bill_date: book.bill_date || "",
        cost: book.cost?.toString() || "",
        withdrawal_remarks: book.withdrawal_remarks || ""
      });
    }
  }, [book, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a book title",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.author.trim()) {
      toast({
        title: "Author Required", 
        description: "Please enter the author name",
        variant: "destructive"
      });
      return false;
    }

    if (parseInt(formData.total_copies) < 1) {
      toast({
        title: "Invalid Copies",
        description: "Total copies must be at least 1",
        variant: "destructive"
      });
      return false;
    }

    if (parseInt(formData.available_copies) > parseInt(formData.total_copies)) {
      toast({
        title: "Invalid Available Copies",
        description: "Available copies cannot exceed total copies",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!book || !validateForm()) return;

    setLoading(true);
    try {
      // Check for duplicate ISBN if it's different from current
      if (formData.isbn.trim() && formData.isbn !== book.isbn) {
        const { data: existingBook } = await supabase
          .from('books')
          .select('id, title, author')
          .eq('isbn', formData.isbn.trim())
          .neq('id', book.id)
          .maybeSingle();

        if (existingBook) {
          toast({
            title: "Duplicate ISBN Found",
            description: `Another book with this ISBN already exists: "${existingBook.title}" by ${existingBook.author}`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('books')
        .update({
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim() || null,
          publisher: formData.publisher.trim() || null,
          category: formData.category || null,
          description: formData.description.trim() || null,
          publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
          total_copies: parseInt(formData.total_copies),
          available_copies: parseInt(formData.available_copies),
          location_shelf: formData.location_shelf.trim() || null,
          rack_number: formData.rack_number.trim() || null,
          row_shelf_number: formData.row_shelf_number.trim() || null,
          acquisition_date: formData.acquisition_date || null,
          accession_number: formData.accession_number.trim() || null,
          edition: formData.edition.trim() || null,
          pages: formData.pages ? parseInt(formData.pages) : null,
          volume: formData.volume.trim() || null,
          source: formData.source || null,
          bill_number: formData.bill_number.trim() || null,
          bill_date: formData.bill_date || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          withdrawal_remarks: formData.withdrawal_remarks.trim() || null
        })
        .eq('id', book.id);

      if (error) throw error;

      toast({
        title: "Book Updated",
        description: `"${formData.title}" has been updated successfully`,
      });

      onBookUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating book:', error);
      toast({
        title: "Failed to Update Book",
        description: error.message || "There was an error updating the book",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!book) return;

    // Check if book has been borrowed
    const borrowedCopies = book.total_copies - book.available_copies;
    if (borrowedCopies > 0) {
      toast({
        title: "Cannot Delete Book",
        description: `This book has ${borrowedCopies} copies currently borrowed. Please wait for all copies to be returned before deleting.`,
        variant: "destructive"
      });
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      toast({
        title: "Book Deleted",
        description: `"${book.title}" has been removed from the library`,
      });

      onBookUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast({
        title: "Failed to Delete Book",
        description: error.message || "There was an error deleting the book",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Edit Book
          </DialogTitle>
          <DialogDescription>
            Update book information. Changes will be saved to the library database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book Cover */}
          {book.cover_image_url && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-16 h-20 object-cover rounded border"
              />
              <div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Cover Image
                </Badge>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter book title"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author *</Label>
              <Input
                id="edit-author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Enter author name"
              />
            </div>

            {/* ISBN */}
            <div className="space-y-2">
              <Label htmlFor="edit-isbn">ISBN</Label>
              <Input
                id="edit-isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
                placeholder="Enter ISBN"
              />
            </div>

            {/* Publisher */}
            <div className="space-y-2">
              <Label htmlFor="edit-publisher">Publisher</Label>
              <Input
                id="edit-publisher"
                value={formData.publisher}
                onChange={(e) => handleInputChange('publisher', e.target.value)}
                placeholder="Enter publisher"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
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

            {/* Publication Year */}
            <div className="space-y-2">
              <Label htmlFor="edit-year">Publication Year</Label>
              <Input
                id="edit-year"
                type="number"
                value={formData.publication_year}
                onChange={(e) => handleInputChange('publication_year', e.target.value)}
                placeholder="YYYY"
              />
            </div>

            {/* Total Copies */}
            <div className="space-y-2">
              <Label htmlFor="edit-total">Total Copies</Label>
              <Input
                id="edit-total"
                type="number"
                min="1"
                value={formData.total_copies}
                onChange={(e) => handleInputChange('total_copies', e.target.value)}
              />
            </div>

            {/* Available Copies */}
            <div className="space-y-2">
              <Label htmlFor="edit-available">Available Copies</Label>
              <Input
                id="edit-available"
                type="number"
                min="0"
                max={formData.total_copies}
                value={formData.available_copies}
                onChange={(e) => handleInputChange('available_copies', e.target.value)}
              />
            </div>

            {/* Rack Number */}
            <div className="space-y-2">
              <Label htmlFor="edit-rack">Rack Number</Label>
              <Input
                id="edit-rack"
                value={formData.rack_number}
                onChange={(e) => handleInputChange('rack_number', e.target.value)}
                placeholder="e.g., A, B, CS"
              />
            </div>

            {/* Row/Shelf Number */}
            <div className="space-y-2">
              <Label htmlFor="edit-row">Row/Shelf Number</Label>
              <Input
                id="edit-row"
                value={formData.row_shelf_number}
                onChange={(e) => handleInputChange('row_shelf_number', e.target.value)}
                placeholder="e.g., 1, 23, 101"
              />
            </div>

            {/* Additional Location Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-shelf">Additional Location Notes</Label>
              <Input
                id="edit-shelf"
                value={formData.location_shelf}
                onChange={(e) => handleInputChange('location_shelf', e.target.value)}
                placeholder="e.g., Near window, Top shelf"
              />
            </div>
          </div>

          {/* New Acquisition & Details Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
            <h3 className="text-lg font-semibold">Acquisition & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-acquisition-date">Date (तारीख)</Label>
                <Input
                  id="edit-acquisition-date"
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => handleInputChange('acquisition_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-accession-number">Accession Number (क्रमांक संख्या)</Label>
                <Input
                  id="edit-accession-number"
                  placeholder="Unique ID for book entry"
                  value={formData.accession_number}
                  onChange={(e) => handleInputChange('accession_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-edition">Edition (संस्करण)</Label>
                <Input
                  id="edit-edition"
                  placeholder="e.g., 1st, 2nd, Revised"
                  value={formData.edition}
                  onChange={(e) => handleInputChange('edition', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pages">Pages (पृष्ठ)</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  placeholder="Total pages"
                  value={formData.pages}
                  onChange={(e) => handleInputChange('pages', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-volume">Vol. (खण्ड)</Label>
                <Input
                  id="edit-volume"
                  placeholder="Volume number"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-source">Source (स्रोत)</Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bill-number">Bill No. (बिल क्रमांक)</Label>
                <Input
                  id="edit-bill-number"
                  placeholder="Purchase bill number"
                  value={formData.bill_number}
                  onChange={(e) => handleInputChange('bill_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bill-date">Bill Date (बिल दिनांक)</Label>
                <Input
                  id="edit-bill-date"
                  type="date"
                  value={formData.bill_date}
                  onChange={(e) => handleInputChange('bill_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cost">Cost (मूल्य)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  placeholder="Book price"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-withdrawal-remarks">Withdrawal/Remarks</Label>
              <Textarea
                id="edit-withdrawal-remarks"
                placeholder="Notes if book is withdrawn or removed"
                value={formData.withdrawal_remarks}
                onChange={(e) => handleInputChange('withdrawal_remarks', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter book description"
              rows={3}
            />
          </div>

          {/* Warning for borrowed books */}
          {book.total_copies - book.available_copies > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                This book has {book.total_copies - book.available_copies} copies currently borrowed.
                Deleting is disabled until all copies are returned.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || loading || (book.total_copies - book.available_copies > 0)}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Book
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || deleting}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Book
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};