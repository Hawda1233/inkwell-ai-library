import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, BookOpen, QrCode, Trash2 } from "lucide-react";

interface Student {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  booksIssued?: number;
  student_number?: string;
  digital_id_active?: boolean;
}

interface ViewStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
}

export const ViewStudentDialog = ({ student, open, onOpenChange, onStudentUpdated }: ViewStudentDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: student?.full_name || "",
    email: student?.email || ""
  });

  const handleUpdate = async () => {
    if (!student) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          email: formData.email
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });

      onStudentUpdated();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error Updating Student",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDigitalId = async () => {
    if (!student) return;

    setIsLoading(true);
    try {
      // Deactivate old digital ID
      const { error: deactivateError } = await supabase
        .from('student_digital_ids')
        .update({ is_active: false })
        .eq('student_id', student.id);

      if (deactivateError) throw deactivateError;

      // Generate new digital ID
      const studentNum = new Date().getFullYear().toString() + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const qrData = JSON.stringify({
        student_id: student.id,
        student_number: studentNum,
        email: student.email,
        full_name: student.full_name,
        issued_at: new Date().toISOString()
      });

      const { error: createError } = await supabase
        .from('student_digital_ids')
        .insert([{
          student_id: student.id,
          student_number: studentNum,
          qr_code_data: qrData,
          is_active: true
        }]);

      if (createError) throw createError;

      toast({
        title: "Digital ID Reset",
        description: "A new digital ID has been generated for the student.",
      });

      onStudentUpdated();
    } catch (error: any) {
      toast({
        title: "Error Resetting Digital ID",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Student Profile
          </DialogTitle>
          <DialogDescription>
            View and manage student information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{student.full_name || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{student.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                  <span>{new Date(student.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Books Issued:</span>
                  <Badge variant="secondary">{student.booksIssued || 0}</Badge>
                </div>

                {student.student_number && (
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Digital ID:</span>
                    <span>{student.student_number}</span>
                    <Badge variant={student.digital_id_active ? "default" : "destructive"} className="text-xs">
                      {student.digital_id_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(true);
                    setFormData({
                      fullName: student.full_name || "",
                      email: student.email
                    });
                  }}
                  className="flex-1"
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetDigitalId}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Reset Digital ID
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editFullName">Full Name</Label>
                  <Input
                    id="editFullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};