import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type StudentRecord = {
  id: string;
  full_name: string;
  email?: string | null;
  course_level: 'UG' | 'PG';
  program: 'BCom' | 'MCom' | 'BBA' | 'BCA' | 'BA' | 'BEd' | 'DEd' | 'BSc' | 'MSc';
  year: number;
  division: string;
  roll_number: string;
  student_number?: string | null;
};

interface EditStudentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRecord | null;
  onSaved: () => void;
}

export const EditStudentRecordDialog = ({ open, onOpenChange, student, onSaved }: EditStudentRecordDialogProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<StudentRecord | null>(student);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(student);
  }, [student]);

  const handleSave = async () => {
    if (!form) return;
    if (!form.full_name || !form.program || !form.division || !form.roll_number) {
      toast({ title: "Missing fields", description: "Please fill required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email || null,
        course_level: form.course_level,
        program: form.program,
        year: form.year,
        division: form.division,
        roll_number: form.roll_number,
        student_number: form.student_number || null,
      };
      const { error } = await (supabase as any).from('students').update(payload).eq('id', form.id);
      if (error) throw error;
      toast({ title: "Student updated" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student details. Email is optional.</DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={form.course_level} onValueChange={(v) => setForm({ ...form, course_level: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UG">UG</SelectItem>
                    <SelectItem value="PG">PG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Division</Label>
                <Input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Student Number (optional)</Label>
                <Input value={form.student_number || ''} onChange={(e) => setForm({ ...form, student_number: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
