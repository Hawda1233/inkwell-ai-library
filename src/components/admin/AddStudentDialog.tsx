import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void;
}

export const AddStudentDialog = ({ open, onOpenChange, onStudentAdded }: AddStudentDialogProps) => {
  const { toast } = useToast();
const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    courseLevel: "UG",
    program: "BCom",
    year: 1,
    division: "",
    rollNumber: "",
    studentNumber: ""
  });
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.fullName || !formData.program || !formData.division || !formData.rollNumber) {
        toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
        return;
      }

      const { error } = await (supabase as any)
        .from('students')
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email || null,
            course_level: formData.courseLevel,
            program: formData.program,
            year: formData.year,
            division: formData.division,
            roll_number: formData.rollNumber,
            student_number: formData.studentNumber || null,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Student Added Successfully",
        description: `${formData.fullName} has been added.`,
      });

      onStudentAdded();
      onOpenChange(false);
      setFormData({ fullName: "", email: "", courseLevel: "UG", program: "BCom", year: 1, division: "", rollNumber: "", studentNumber: "" });
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({ title: "Error Adding Student", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Student
          </DialogTitle>
          <DialogDescription>
            Add a student record (no student login). Email is optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="Enter student's full name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address (optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter student's email (optional)"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course Level</Label>
              <Select value={formData.courseLevel} onValueChange={(v) => setFormData(prev => ({ ...prev, courseLevel: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UG">UG</SelectItem>
                  <SelectItem value="PG">PG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={formData.program} onValueChange={(v) => setFormData(prev => ({ ...prev, program: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BCom">BCom</SelectItem>
                  <SelectItem value="MCom">MCom</SelectItem>
                  <SelectItem value="BBA">BBA</SelectItem>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="BEd">BEd</SelectItem>
                  <SelectItem value="DEd">DEd</SelectItem>
                  <SelectItem value="BSc">BSc</SelectItem>
                  <SelectItem value="MSc">MSc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(formData.year)} onValueChange={(v) => setFormData(prev => ({ ...prev, year: Number(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <Input id="division" placeholder="e.g., A" value={formData.division} onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roll">Roll Number</Label>
              <Input id="roll" placeholder="e.g., 123" value={formData.rollNumber} onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studnum">Student Number (optional)</Label>
              <Input id="studnum" placeholder="Optional unique student number" value={formData.studentNumber} onChange={(e) => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};