import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogIn, LogOut, Clock, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LibraryCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated: () => void;
  scannedStudent?: any;
}

interface ActiveSession {
  id: string;
  check_in_time: string;
  purpose?: string;
  session_status: string;
}

export const LibraryCheckInDialog = ({ open, onOpenChange, onSessionUpdated, scannedStudent }: LibraryCheckInDialogProps) => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && scannedStudent) {
      checkActiveSession();
    }
  }, [open, scannedStudent]);

  const checkActiveSession = async () => {
    if (!scannedStudent) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('library_sessions')
        .select('*')
        .eq('student_id', scannedStudent.student_id)
        .eq('session_status', 'active')
        .order('check_in_time', { ascending: false })
        .limit(1);

      if (error) throw error;

      setActiveSession(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error checking active session:', error);
      toast({
        title: "Error Loading Session",
        description: "Could not check library session status.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedStudent) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('library_sessions')
        .insert({
          student_id: scannedStudent.student_id,
          purpose: purpose || null,
          session_status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Check-in Successful",
        description: `${scannedStudent.full_name || scannedStudent.email} has been checked into the library.`,
      });

      onSessionUpdated();
      onOpenChange(false);
      setPurpose('');
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in Failed",
        description: "Could not process library check-in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession || !scannedStudent) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('library_sessions')
        .update({
          check_out_time: new Date().toISOString(),
          session_status: 'completed'
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      toast({
        title: "Check-out Successful",
        description: `${scannedStudent.full_name || scannedStudent.email} has been checked out of the library.`,
      });

      onSessionUpdated();
      onOpenChange(false);
      setActiveSession(null);
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Check-out Failed",
        description: "Could not process library check-out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setPurpose('');
    setActiveSession(null);
    onOpenChange(false);
  };

  if (!scannedStudent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeSession ? (
              <>
                <LogOut className="w-5 h-5 text-orange-600" />
                Library Check-out
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 text-green-600" />
                Library Check-in
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{scannedStudent.full_name || scannedStudent.email}</h3>
                  <p className="text-sm text-muted-foreground">Student #: {scannedStudent.student_number}</p>
                  <p className="text-sm text-muted-foreground">{scannedStudent.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Checking session status...</p>
            </div>
          ) : activeSession ? (
            /* Check-out Section */
            <div className="space-y-4">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Currently in Library</span>
                  </div>
                  <div className="text-sm text-orange-700">
                    <p>Checked in: {format(new Date(activeSession.check_in_time), 'MMM dd, yyyy \'at\' h:mm a')}</p>
                    {activeSession.purpose && (
                      <p className="mt-1">Purpose: {activeSession.purpose}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={handleCheckOut}
                  disabled={processing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Check Out
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Check-in Section */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit (Optional)</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Research, Study, Reading, Group Project..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Library Check-in</p>
                    <p>This will record the student's entry into the library and track their session.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCheckIn}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Check In
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};