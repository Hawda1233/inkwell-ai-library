import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: any) => void;
}

export const QRScanner = ({ open, onOpenChange, onScan }: QRScannerProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    if (open) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const initializeScanner = async () => {
    try {
      codeReader.current = new BrowserMultiFormatReader();
      
      // Get video devices
      const videoInputDevices = await codeReader.current.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      if (videoInputDevices.length > 0) {
        const deviceId = videoInputDevices[0].deviceId;
        setSelectedDevice(deviceId);
        startScanning(deviceId);
      } else {
        toast({
          title: "No Camera Found",
          description: "Please ensure your device has a camera and permissions are granted.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Scanner initialization error:', error);
      toast({
        title: "Scanner Error",
        description: "Failed to initialize camera scanner.",
        variant: "destructive"
      });
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setScanning(true);
      
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            try {
              const qrData = JSON.parse(result.getText());
              
              // Validate QR data structure
              if (qrData.student_id && qrData.student_number && qrData.email) {
                onScan(qrData);
                onOpenChange(false);
                toast({
                  title: "QR Code Scanned",
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
                title: "Invalid QR Code",
                description: "Unable to read student information from QR code.",
                variant: "destructive"
              });
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanning error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Start scanning error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera scanning.",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setScanning(false);
  };

  const switchCamera = (deviceId: string) => {
    setSelectedDevice(deviceId);
    stopScanner();
    startScanning(deviceId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            Scan Student QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-primary rounded-lg w-48 h-48 relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-primary animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera controls */}
          <div className="flex flex-col gap-2">
            {devices.length > 1 && (
              <div className="flex gap-2">
                {devices.map((device, index) => (
                  <Button
                    key={device.deviceId}
                    variant={selectedDevice === device.deviceId ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchCamera(device.deviceId)}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Camera {index + 1}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => scanning ? stopScanner() : startScanning(selectedDevice)}
                className="flex-1"
              >
                {scanning ? (
                  <>
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>
              
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            Position the student's QR code within the scanning frame
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};