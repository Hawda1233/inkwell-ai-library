import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, QrCode, Search, User, Calendar } from "lucide-react";

interface IssueBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookIssued: () => void;
  scannedStudent?: any;
}

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_number: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  available_copies: number;
}

export const IssueBookDialog = ({ open, onOpenChange, onBookIssued, scannedStudent }: IssueBookDialogProps) => {
  const { toast } = useToast();
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dueDays, setDueDays] = useState("14");

  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }

    try {
      // First, get all students with the 'student' role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      if (!studentRoles?.length) {
        setStudents([]);
        return;
      }

      const studentIds = studentRoles.map(role => role.user_id);

      // Search by email, name
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', studentIds)
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);

      if (profilesError) throw profilesError;

      // Get student digital IDs for these profiles
      const { data: digitalIds, error: digitalError } = await supabase
        .from('student_digital_ids')
        .select('student_id, student_number')
        .in('student_id', profilesData?.map(p => p.id) || []);

      if (digitalError) throw digitalError;

      // Also search by student number
      const { data: byStudentNumber, error: studentNumberError } = await supabase
        .from('student_digital_ids')
        .select('student_id, student_number')
        .ilike('student_number', `%${query}%`);

      if (studentNumberError) throw studentNumberError;

      // Combine all student IDs
      const profileIds = profilesData?.map(p => p.id) || [];
      const numberSearchIds = byStudentNumber?.map(d => d.student_id) || [];
      const allStudentIds = [...new Set([...profileIds, ...numberSearchIds])];

      // Get profile details for all found students
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', allStudentIds);

      if (allProfilesError) throw allProfilesError;

      // Combine with student numbers
      const studentsWithNumbers = allProfiles?.map(profile => {
        const digitalId = [...digitalIds || [], ...byStudentNumber || []]
          .find(d => d.student_id === profile.id);
        return {
          ...profile,
          student_number: digitalId?.student_number || 'No Digital ID'
        };
      }) || [];

      setStudents(studentsWithNumbers);
    } catch (error: any) {
      console.error('Error searching students:', error);
      toast({
        title: "Error Searching Students",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const searchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, available_copies')
        .gt('available_copies', 0)
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error: any) {
      console.error('Error loading books:', error);
      toast({
        title: "Error Loading Books",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleIssueBook = async () => {
    if (!selectedStudent || !selectedBookId) {
      toast({
        title: "Missing Information",
        description: "Please select both a student and a book.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

      const { error } = await supabase
        .from('book_transactions')
        .insert([
          {
            student_id: selectedStudent.id,
            book_id: selectedBookId,
            transaction_type: 'borrow',
            due_date: dueDate.toISOString(),
            status: 'active'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Book Issued Successfully",
        description: `Book issued to ${selectedStudent.full_name || selectedStudent.email}`,
      });

      onBookIssued();
      onOpenChange(false);
      
      // Reset form
      setSelectedStudent(null);
      setSelectedBookId("");
      setStudentQuery("");
      setStudents([]);
    } catch (error: any) {
      console.error('Error issuing book:', error);
      toast({
        title: "Error Issuing Book",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // When opening, load books immediately
      searchBooks();
      
      // If there's a scanned student, set them as selected
      if (scannedStudent) {
        setSelectedStudent({
          id: scannedStudent.student_id,
          email: scannedStudent.email,
          full_name: scannedStudent.full_name || scannedStudent.email,
          student_number: scannedStudent.student_number
        });
        setStudentQuery(scannedStudent.full_name || scannedStudent.email);
      }
    } else {
      // When closing, reset form
      setStudentQuery("");
      setSelectedStudent(null);
      setSelectedBookId("");
      setStudents([]);
      setBooks([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Issue Book to Student
          </DialogTitle>
          <DialogDescription>
            Use student digital ID or search by name/email to issue a book
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Search */}
          <div className="space-y-3">
            <Label htmlFor="student-search">Find Student</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="student-search"
                placeholder="Search by name, email, or student number..."
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  searchStudents(e.target.value);
                }}
                className="pl-10"
              />
            </div>

            {/* Student Results */}
            {students.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                      selectedStudent?.id === student.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedStudent(student);
                      setStudentQuery(`${student.full_name || student.email} (${student.student_number})`);
                      setStudents([]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student.full_name || student.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Student ID: {student.student_number}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Student */}
            {selectedStudent && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {selectedStudent.full_name || selectedStudent.email}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Student ID: {selectedStudent.student_number}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Book Selection */}
          <div className="space-y-3">
            <Label htmlFor="book-select">Select Book</Label>
            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book to issue" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{book.title}</span>
                        <span className="text-muted-foreground ml-2">by {book.author}</span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-4">
                        ({book.available_copies} available)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <Label htmlFor="due-days">Loan Period</Label>
            <Select value={dueDays} onValueChange={setDueDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days (Standard)</SelectItem>
                <SelectItem value="21">21 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueBook}
              disabled={!selectedStudent || !selectedBookId || isLoading}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {isLoading ? "Issuing..." : "Issue Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};