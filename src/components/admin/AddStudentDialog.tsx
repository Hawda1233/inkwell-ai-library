import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, User } from "lucide-react";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void;
}

export const AddStudentDialog = ({ open, onOpenChange, onStudentAdded }: AddStudentDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName
            }
          ]);

        if (profileError) throw profileError;

        // Assign student role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: authData.user.id,
              role: 'student'
            }
          ]);

        if (roleError) throw roleError;

        toast({
          title: "Student Added Successfully",
          description: `${formData.fullName} has been registered as a student.`,
        });

        onStudentAdded();
        onOpenChange(false);
        setFormData({ email: "", fullName: "", password: "" });
      }
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error Adding Student",
        description: error.message,
        variant: "destructive"
      });
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
            Create a new student account and digital ID
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
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter student's email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create temporary password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Student can change this password after first login
            </p>
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
              {isLoading ? "Creating..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};