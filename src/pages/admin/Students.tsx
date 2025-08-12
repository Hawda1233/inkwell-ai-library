import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";
// import { ViewStudentDialog } from "@/components/admin/ViewStudentDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BulkStudentImport } from "@/components/admin/BulkStudentImport";
import { Users, Search, Plus, Filter, Download, Mail, QrCode, RefreshCw, Upload, Trash } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email?: string | null;
  course_level: 'UG' | 'PG';
  program: 'BCom' | 'MCom' | 'BBA' | 'BCA' | 'BA' | 'BEd' | 'DEd' | 'BSc' | 'MSc';
  year: number;
  division: string;
  roll_number: string;
  student_number?: string | null;
  created_at: string;
}

export const Students = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStudents(data || []);
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

    const channel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => fetchStudents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q) ||
      s.course_level.toLowerCase().includes(q) ||
      String(s.year).includes(q) ||
      s.division.toLowerCase().includes(q) ||
      s.roll_number.toLowerCase().includes(q) ||
      (s.student_number || '').toLowerCase().includes(q)
    );
  });

  const exportStudents = () => {
    const csvContent = [
      ['Full Name','Email','Level','Program','Year','Division','Roll Number','Student Number','Created At'],
      ...filteredStudents.map(s => [
        s.full_name,
        s.email || '',
        s.course_level,
        s.program,
        String(s.year),
        s.division,
        s.roll_number,
        s.student_number || '',
        new Date(s.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
                  ? "No students added yet. Add or import students to see them here."
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
                      <p><span className="font-medium">Level/Program:</span> {student.course_level} / {student.program}</p>
                      <p><span className="font-medium">Year:</span> {student.year} &nbsp; <span className="font-medium ml-2">Division:</span> {student.division}</p>
                      <p><span className="font-medium">Roll No:</span> {student.roll_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      onClick={async () => {
                        if (!confirm(`Delete ${student.full_name}?`)) return;
                        const { error } = await (supabase as any).from('students').delete().eq('id', student.id);
                        if (error) {
                          toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: 'Student deleted' });
                          fetchStudents();
                        }
                      }}
                    >
                      <Trash className="w-4 h-4 mr-2" /> Delete
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