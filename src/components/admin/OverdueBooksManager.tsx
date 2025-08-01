import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, DollarSign, Book, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function OverdueBooksManager() {
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch overdue transactions
  const { data: overdueTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['overdue-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_transactions')
        .select(`
          id,
          student_id,
          book_id,
          due_date,
          transaction_date,
          books (
            title,
            author
          )
        `)
        .eq('status', 'active')
        .eq('transaction_type', 'borrow')
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
  });

  // Fetch student profiles
  const { data: profiles } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch fines
  const { data: fines } = useQuery({
    queryKey: ['fines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fines')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate fines mutation
  const calculateFinesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('calculate_overdue_fines');
      if (error) throw error;
      return data;
    },
    onSuccess: (finesCreated) => {
      toast({
        title: "Fines Calculated",
        description: `Created ${finesCreated} new fine(s) for overdue books.`,
      });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to calculate fines. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Pay fine mutation
  const payFineMutation = useMutation({
    mutationFn: async (fineId: string) => {
      const { error } = await supabase
        .from('fines')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', fineId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Fine Paid",
        description: "Fine has been marked as paid.",
      });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setSelectedFine(null);
    },
  });

  // Waive fine mutation
  const waiveFineMutation = useMutation({
    mutationFn: async (fineId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('fines')
        .update({ 
          status: 'waived',
          waived_at: new Date().toISOString(),
          waived_by: user?.id
        })
        .eq('id', fineId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Fine Waived",
        description: "Fine has been waived.",
      });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setSelectedFine(null);
    },
  });

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStudentProfile = (studentId: string) => {
    return profiles?.find(p => p.id === studentId);
  };

  const getFineForTransaction = (transactionId: string) => {
    return fines?.find(f => f.transaction_id === transactionId);
  };

  const getTotalFines = () => {
    if (!fines) return 0;
    return fines.reduce((total, fine) => total + (fine.fine_amount || 0), 0);
  };

  const getUnpaidFines = () => {
    if (!fines) return 0;
    return fines.filter(f => f.status === 'unpaid').length;
  };

  const isLoading = transactionsLoading;

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
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTransactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Books currently overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getTotalFines().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding fine amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Fines</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUnpaidFines()}</div>
            <p className="text-xs text-muted-foreground">
              Fines awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Fine Management</CardTitle>
          <CardDescription>
            Calculate fines for overdue books and manage existing fines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => calculateFinesMutation.mutate()}
            disabled={calculateFinesMutation.isPending}
            className="mr-4"
          >
            {calculateFinesMutation.isPending ? 'Calculating...' : 'Calculate New Fines'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will create fines for books that are overdue but don't have fines yet.
          </p>
        </CardContent>
      </Card>

      {/* Overdue Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Books</CardTitle>
          <CardDescription>
            Manage overdue books and their associated fines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdueTransactions && overdueTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Fine Status</TableHead>
                  <TableHead>Fine Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueTransactions.map((transaction) => {
                  const daysOverdue = getDaysOverdue(transaction.due_date);
                  const studentProfile = getStudentProfile(transaction.student_id);
                  const fine = getFineForTransaction(transaction.id);
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{studentProfile?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{studentProfile?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.books?.title}</div>
                          <div className="text-sm text-muted-foreground">by {transaction.books?.author}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.due_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fine ? (
                          <Badge 
                            variant={
                              fine.status === 'paid' ? 'default' : 
                              fine.status === 'waived' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {fine.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No fine</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {fine ? `₹${fine.fine_amount}` : '-'}
                      </TableCell>
                      <TableCell>
                        {fine && fine.status === 'unpaid' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedFine(fine)}
                              >
                                Manage Fine
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage Fine</DialogTitle>
                                <DialogDescription>
                                  Fine for {studentProfile?.full_name} - {transaction.books?.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Days Overdue</label>
                                    <p className="text-lg">{fine.days_overdue}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Fine Amount</label>
                                    <p className="text-lg">₹{fine.fine_amount}</p>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline"
                                  onClick={() => waiveFineMutation.mutate(fine.id)}
                                  disabled={waiveFineMutation.isPending}
                                >
                                  Waive Fine
                                </Button>
                                <Button 
                                  onClick={() => payFineMutation.mutate(fine.id)}
                                  disabled={payFineMutation.isPending}
                                >
                                  Mark as Paid
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Book className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No overdue books</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All books are returned on time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}