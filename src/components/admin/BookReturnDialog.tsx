import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface BookReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooksReturned: () => void;
  scannedStudent?: any;
}

interface BorrowedBook {
  id: string;
  book_id: string;
  title: string;
  author: string;
  transaction_date: string;
  due_date: string;
  status: string;
  notes?: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export const BookReturnDialog = ({ open, onOpenChange, onBooksReturned, scannedStudent }: BookReturnDialogProps) => {
  const { toast } = useToast();
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (open && scannedStudent) {
      fetchBorrowedBooks();
    }
  }, [open, scannedStudent]);

  const fetchBorrowedBooks = async () => {
    if (!scannedStudent) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('book_transactions')
        .select(`
          id,
          book_id,
          transaction_date,
          due_date,
          status,
          notes,
          books(title, author)
        `)
        .eq('student_id', scannedStudent.student_id)
        .eq('transaction_type', 'borrow')
        .eq('status', 'active')
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const books = (data || []).map(transaction => {
        const dueDate = new Date(transaction.due_date);
        const today = new Date();
        const isOverdue = dueDate < today;
        const daysOverdue = isOverdue ? differenceInDays(today, dueDate) : 0;

        return {
          id: transaction.id,
          book_id: transaction.book_id,
          title: transaction.books?.title || 'Unknown Title',
          author: transaction.books?.author || 'Unknown Author',
          transaction_date: transaction.transaction_date,
          due_date: transaction.due_date,
          status: transaction.status,
          notes: transaction.notes,
          isOverdue,
          daysOverdue
        };
      });

      setBorrowedBooks(books);
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
      toast({
        title: "Error Loading Books",
        description: "Could not fetch borrowed books for this student.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelection = (bookId: string, checked: boolean) => {
    setSelectedBooks(prev => 
      checked 
        ? [...prev, bookId]
        : prev.filter(id => id !== bookId)
    );
  };

  const handleSelectAll = () => {
    const allBookIds = borrowedBooks.map(book => book.id);
    setSelectedBooks(
      selectedBooks.length === borrowedBooks.length ? [] : allBookIds
    );
  };

  const handleReturnBooks = async () => {
    if (selectedBooks.length === 0) {
      toast({
        title: "No Books Selected",
        description: "Please select at least one book to return.",
        variant: "destructive"
      });
      return;
    }

    setReturning(true);
    try {
      // Update book transactions to 'returned' status
      const { error } = await supabase
        .from('book_transactions')
        .update({ 
          status: 'returned',
          returned_date: new Date().toISOString()
        })
        .in('id', selectedBooks);

      if (error) throw error;

      toast({
        title: "Books Returned Successfully",
        description: `${selectedBooks.length} book(s) have been returned.`,
      });

      onBooksReturned();
      onOpenChange(false);
      setSelectedBooks([]);
      setBorrowedBooks([]);
    } catch (error) {
      console.error('Error returning books:', error);
      toast({
        title: "Error Returning Books",
        description: "Could not process book returns. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReturning(false);
    }
  };

  const handleClose = () => {
    setSelectedBooks([]);
    setBorrowedBooks([]);
    onOpenChange(false);
  };

  if (!scannedStudent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Return Books - {scannedStudent.full_name || scannedStudent.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{scannedStudent.full_name || scannedStudent.email}</h3>
                  <p className="text-sm text-muted-foreground">Student #: {scannedStudent.student_number}</p>
                  <p className="text-sm text-muted-foreground">Email: {scannedStudent.email}</p>
                </div>
                <Badge variant="secondary">
                  {borrowedBooks.length} Active Loans
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Borrowed Books */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading borrowed books...</p>
            </div>
          ) : borrowedBooks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Loans</h3>
                <p className="text-muted-foreground">This student has no books currently borrowed.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedBooks.length === borrowedBooks.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({borrowedBooks.length} books)
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedBooks.length} of {borrowedBooks.length} selected
                </p>
              </div>

              {/* Books List */}
              <div className="space-y-3">
                {borrowedBooks.map((book) => (
                  <Card key={book.id} className={`transition-all ${book.isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedBooks.includes(book.id)}
                          onCheckedChange={(checked) => handleBookSelection(book.id, checked as boolean)}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{book.title}</h4>
                              <p className="text-sm text-muted-foreground">by {book.author}</p>
                            </div>
                            {book.isOverdue && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {book.daysOverdue} days overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>Borrowed: {format(new Date(book.transaction_date), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className={book.isOverdue ? 'text-destructive font-medium' : ''}>
                                Due: {format(new Date(book.due_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                          
                          {book.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Notes:</strong> {book.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleReturnBooks}
                  disabled={selectedBooks.length === 0 || returning}
                  className="flex-1"
                >
                  {returning ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing Return...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Return Selected Books ({selectedBooks.length})
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};