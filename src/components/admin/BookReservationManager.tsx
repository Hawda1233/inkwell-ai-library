import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Users, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function BookReservationManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const queryClient = useQueryClient();

  // Fetch reservations
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['book-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_reservations')
        .select(`
          id,
          book_id,
          student_id,
          reserved_at,
          status,
          priority_order,
          expires_at,
          fulfilled_at,
          cancelled_at
        `)
        .order('reserved_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch books
  const { data: books } = useQuery({
    queryKey: ['available-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, available_copies, total_copies')
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async ({ bookId, studentId }: { bookId: string; studentId: string }) => {
      const { error } = await supabase
        .from('book_reservations')
        .insert({
          book_id: bookId,
          student_id: studentId,
          status: 'active'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Reservation Created",
        description: "Book reservation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['book-reservations'] });
      setIsDialogOpen(false);
      setSelectedBook('');
      setSelectedStudent('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('book_reservations')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Reservation Cancelled",
        description: "Book reservation has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['book-reservations'] });
    },
  });

  // Fulfill reservation mutation
  const fulfillReservationMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('book_reservations')
        .update({ 
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Reservation Fulfilled",
        description: "Book reservation has been marked as fulfilled.",
      });
      queryClient.invalidateQueries({ queryKey: ['book-reservations'] });
    },
  });

  const getStudentProfile = (studentId: string) => {
    return students?.find(s => s.id === studentId);
  };

  const getBookDetails = (bookId: string) => {
    return books?.find(b => b.id === bookId);
  };

  const getActiveReservations = () => {
    return reservations?.filter(r => r.status === 'active') || [];
  };

  const getFulfilledReservations = () => {
    return reservations?.filter(r => r.status === 'fulfilled') || [];
  };

  const getReservationsByBook = (bookId: string) => {
    return reservations?.filter(r => r.book_id === bookId && r.status === 'active').length || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reservations</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveReservations().length}</div>
            <p className="text-xs text-muted-foreground">
              Books currently reserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled Today</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getFulfilledReservations().filter(r => 
                r.fulfilled_at && 
                new Date(r.fulfilled_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reservations fulfilled today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time reservations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation Management</CardTitle>
          <CardDescription>
            Create and manage book reservations for students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Reservation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Book Reservation</DialogTitle>
                <DialogDescription>
                  Reserve a book for a student. The reservation will be added to the queue.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="book">Book</Label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books?.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author} 
                          {book.available_copies === 0 && (
                            <span className="text-destructive"> (Currently borrowed)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => createReservationMutation.mutate({ 
                    bookId: selectedBook, 
                    studentId: selectedStudent 
                  })}
                  disabled={!selectedBook || !selectedStudent || createReservationMutation.isPending}
                >
                  {createReservationMutation.isPending ? 'Creating...' : 'Create Reservation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Book Reservations</CardTitle>
          <CardDescription>
            Manage all book reservations and their queue positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reservations && reservations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Reserved Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queue Position</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const studentProfile = getStudentProfile(reservation.student_id);
                  const bookDetails = getBookDetails(reservation.book_id);
                  const bookReservations = getReservationsByBook(reservation.book_id);
                  
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{studentProfile?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{studentProfile?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bookDetails?.title}</div>
                          <div className="text-sm text-muted-foreground">by {bookDetails?.author}</div>
                          <div className="text-xs text-muted-foreground">
                            {bookDetails?.available_copies}/{bookDetails?.total_copies} available
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.reserved_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          #{reservation.priority_order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            reservation.status === 'fulfilled' ? 'default' : 
                            reservation.status === 'cancelled' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reservation.status === 'active' && (
                          <div className="flex items-center gap-1">
                            <span>{reservation.priority_order} of {bookReservations}</span>
                            {reservation.priority_order === 1 && bookDetails?.available_copies === 0 && (
                              <AlertCircle className="h-4 w-4 text-warning" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {reservation.status === 'active' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => fulfillReservationMutation.mutate(reservation.id)}
                                disabled={fulfillReservationMutation.isPending}
                              >
                                Fulfill
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => cancelReservationMutation.mutate(reservation.id)}
                                disabled={cancelReservationMutation.isPending}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No reservations</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No book reservations have been created yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}