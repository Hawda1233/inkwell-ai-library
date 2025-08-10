import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";
import { ViewStudentDialog } from "@/components/admin/ViewStudentDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BulkStudentImport } from "@/components/admin/BulkStudentImport";
import { Users, Search, Plus, Filter, Download, Mail, QrCode, RefreshCw, Upload } from "lucide-react";

interface Student {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  booksIssued?: number;
  student_number?: string;
  digital_id_active?: boolean;
}

export const Students = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [viewStudentOpen, setViewStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Get all users with student role and their profile data
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

      // Get profile information for students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

      if (profilesError) throw profilesError;

      // Get digital IDs for students
      const { data: digitalIds, error: digitalIdsError } = await supabase
        .from('student_digital_ids')
        .select('student_id, student_number, is_active')
        .in('student_id', studentIds);

      if (digitalIdsError) throw digitalIdsError;

      // Get book transactions for each student to count issued books
      const { data: transactions, error: transactionsError } = await supabase
        .from('book_transactions')
        .select('student_id')
        .eq('status', 'active')
        .eq('transaction_type', 'borrow');

      if (transactionsError) throw transactionsError;

      // Count books issued per student
      const booksIssuedCount = transactions?.reduce((acc: any, transaction) => {
        acc[transaction.student_id] = (acc[transaction.student_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Create digital ID lookup
      const digitalIdLookup = digitalIds?.reduce((acc: any, digitalId) => {
        acc[digitalId.student_id] = digitalId;
        return acc;
      }, {}) || {};

      // Combine data
      const studentsData = profiles?.map(profile => {
        const digitalId = digitalIdLookup[profile.id];
        return {
          ...profile,
          booksIssued: booksIssuedCount[profile.id] || 0,
          student_number: digitalId?.student_number || null,
          digital_id_active: digitalId?.is_active || false
        };
      }) || [];

      setStudents(studentsData);

    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error Loading Students",
        description: "Could not fetch student data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('students-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('students-roles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query) ||
      student.student_number?.toLowerCase().includes(query)
    );
  });

  const exportStudents = () => {
    const csvContent = [
      ["Name", "Email", "ID", "Books Issued", "Joined Date"],
      ...filteredStudents.map(student => [
        student.full_name || "Unknown",
        student.email,
        student.id,
        student.booksIssued || 0,
        new Date(student.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students Management</h1>
            <p className="text-muted-foreground">Manage student accounts and library access</p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setAddStudentOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, ID, email, or student number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  toast({
                    title: "Filters Coming Soon",
                    description: "Advanced filtering options will be available soon.",
                  });
                }}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={exportStudents}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button 
                className="flex items-center gap-2" 
                onClick={() => setBulkOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground mb-4">
                {students.length === 0 
                  ? "No students registered yet. Students will appear here after they sign up."
                  : "No students match your current search criteria."
                }
              </p>
              {students.length === 0 && (
                <Button onClick={() => setAddStudentOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Students
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.full_name}`} />
                        <AvatarFallback>
                          {student.full_name ? student.full_name.split(' ').map(n => n[0]).join('') : 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.full_name || 'Unnamed Student'}</CardTitle>
                        <CardDescription>ID: {student.id.slice(0, 8)}...</CardDescription>
                      </div>
                    </div>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{student.email}</span>
                    </div>
                    {student.student_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ID: {student.student_number}</span>
                      </div>
                    )}
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Joined:</span> {new Date(student.created_at).toLocaleDateString()}</p>
                      <p><span className="font-medium">Books Issued:</span> {student.booksIssued || 0}</p>
                      {student.student_number && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Digital ID:</span>
                          <Badge variant={student.digital_id_active ? "default" : "destructive"} className="text-xs">
                            {student.digital_id_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedStudent(student);
                        setViewStudentOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedStudent(student);
                        setViewStudentOpen(true);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        onStudentAdded={fetchStudents}
      />

      <ViewStudentDialog
        student={selectedStudent}
        open={viewStudentOpen}
        onOpenChange={setViewStudentOpen}
        onStudentUpdated={fetchStudents}
      />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
          </DialogHeader>
          <BulkStudentImport onComplete={() => { setBulkOpen(false); fetchStudents(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};