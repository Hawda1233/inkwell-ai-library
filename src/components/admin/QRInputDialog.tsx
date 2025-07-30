import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScanLine, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: any) => void;
}

export const QRInputDialog = ({ open, onOpenChange, onScan }: QRInputDialogProps) => {
  const { toast } = useToast();
  const [qrInput, setQrInput] = useState("");

  const handleSubmit = () => {
    if (!qrInput.trim()) {
      toast({
        title: "No Input",
        description: "Please scan or enter QR code data.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try to parse as JSON first (for our QR codes)
      const qrData = JSON.parse(qrInput.trim());
      
      // Validate QR data structure
      if (qrData.student_id && qrData.student_number && qrData.email) {
        onScan(qrData);
        onOpenChange(false);
        setQrInput("");
        toast({
          title: "QR Code Processed",
          description: `Student ${qrData.full_name || qrData.email} selected for book issuance.`,
        });
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not a valid student digital ID.",
          variant: "destructive"
        });
      }
    } catch (parseError) {
      toast({
        title: "Invalid QR Code Format",
        description: "Unable to read student information from QR code. Please ensure you're scanning a valid student digital ID.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Auto-submit when Enter is pressed (common with QR scanners)
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    setQrInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            QR Scanner Input
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-input">QR Code Data</Label>
            <Textarea
              id="qr-input"
              placeholder="Scan QR code with your scanner device or paste QR data here..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] font-mono text-sm"
              autoFocus
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ScanLine className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium text-foreground mb-1">Instructions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Point your QR scanner at the student's digital ID</li>
                  <li>• The scanner will automatically input the data</li>
                  <li>• Press Enter or click Process to continue</li>
                  <li>• You can also manually paste QR code data</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit}
              className="flex-1"
              disabled={!qrInput.trim()}
            >
              Process QR Code
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};