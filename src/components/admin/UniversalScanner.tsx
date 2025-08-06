import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CameraOff, 
  ScanLine, 
  Keyboard, 
  Upload,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UniversalScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: any) => void;
  onBookScan?: (bookData: any) => void;
  title?: string;
  description?: string;
  mode?: 'student' | 'book' | 'universal';
}

export const UniversalScanner = ({ 
  open, 
  onOpenChange, 
  onScan, 
  onBookScan,
  title = "Universal Scanner",
  description = "Scan QR codes and barcodes for students and books",
  mode = 'universal'
}: UniversalScannerProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  
  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [scanMode, setScanMode] = useState<'camera' | 'file' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Barcode reader keyboard input buffer
  const [keyboardBuffer, setKeyboardBuffer] = useState('');
  const keyboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  
  // Camera settings
  const [resolution, setResolution] = useState<'auto' | 'hd' | 'fhd'>('auto');
  const [torchMode, setTorchMode] = useState(false);
  const [autoFocus, setAutoFocus] = useState(true);
  
  // Enhanced barcode format support
  const supportedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.PDF_417,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.AZTEC,
    BarcodeFormat.CODABAR,
    BarcodeFormat.ITF,
    BarcodeFormat.RSS_14,
    BarcodeFormat.RSS_EXPANDED
  ];

  const initializeScanner = useCallback(async () => {
    try {
      // Enhanced reader with all format support
      codeReader.current = new BrowserMultiFormatReader();
      
      // Configure decode hints for better compatibility
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, supportedFormats);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
      
      codeReader.current.hints = hints;
      
      // Get video devices with enhanced detection
      const videoInputDevices = await codeReader.current.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      if (videoInputDevices.length > 0) {
        // Prefer back camera for mobile devices
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        const deviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;
        setSelectedDevice(deviceId);
        
        if (scanMode === 'camera') {
          await startScanning(deviceId);
        }
      } else {
        toast({
          title: "No Camera Available",
          description: "Switch to manual input or file upload mode.",
          variant: "destructive"
        });
        setScanMode('manual');
      }
    } catch (error) {
      console.error('Scanner initialization error:', error);
      toast({
        title: "Scanner Initialization Failed",
        description: "Falling back to manual input mode.",
        variant: "destructive"
      });
      setScanMode('manual');
    }
  }, [scanMode]);

  const getVideoConstraints = (deviceId: string) => {
    const baseConstraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: deviceId },
        facingMode: { ideal: 'environment' },
        width: { ideal: resolution === 'fhd' ? 1920 : resolution === 'hd' ? 1280 : 640 },
        height: { ideal: resolution === 'fhd' ? 1080 : resolution === 'hd' ? 720 : 480 },
        frameRate: { ideal: 30, min: 15 },
        focusMode: autoFocus ? 'continuous' : 'manual',
        whiteBalanceMode: 'auto',
        exposureMode: 'auto'
      } as any,
      audio: false
    };

    // Add torch support if available
    if (torchMode) {
      (baseConstraints.video as any).torch = true;
    }

    return baseConstraints;
  };

  const startScanning = async (deviceId: string) => {
    if (!codeReader.current || !videoRef.current || scanMode !== 'camera') return;

    try {
      setScanning(true);
      setIsProcessing(false);

      const constraints = getVideoConstraints(deviceId);
      
      await codeReader.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (result && !isProcessing) {
            setIsProcessing(true);
            handleScanResult(result.getText());
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.warn('Scanning error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Start scanning error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Try switching cameras or use manual input.",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopScanner = useCallback(() => {
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (error) {
        console.warn('Scanner reset error:', error);
      }
    }
    setScanning(false);
    setIsProcessing(false);
  }, []);

  const handleScanResult = (text: string) => {
    try {
      // Try to parse as JSON first (for structured QR codes)
      let parsedData;
      let isJSON = false;
      
      try {
        parsedData = JSON.parse(text);
        isJSON = true;
      } catch {
        // If not JSON, treat as plain text
        parsedData = { rawData: text, type: 'barcode' };
      }
      
      // Check if it's a student QR code
      if (isJSON && parsedData.student_id && parsedData.student_number && parsedData.email) {
        if (mode === 'book') {
          toast({
            title: "Student ID Detected",
            description: "This appears to be a student ID. Please scan a book QR code or barcode.",
            variant: "destructive"
          });
          setTimeout(() => setIsProcessing(false), 1000);
          return;
        }
        
        onScan(parsedData);
        onOpenChange(false);
        toast({
          title: "Student ID Scanned",
          description: `Student ${parsedData.full_name || parsedData.email} selected.`,
        });
        return;
      }
      
      // Check if it's a book QR code (JSON with book info)
      if (isJSON && (parsedData.book_id || parsedData.isbn || parsedData.title)) {
        if (mode === 'student') {
          toast({
            title: "Book Code Detected",
            description: "This appears to be a book code. Please scan a student ID.",
            variant: "destructive"
          });
          setTimeout(() => setIsProcessing(false), 1000);
          return;
        }
        
        if (onBookScan) {
          onBookScan(parsedData);
        } else {
          onScan({ ...parsedData, type: 'book' });
        }
        onOpenChange(false);
        toast({
          title: "Book Scanned",
          description: `Book "${parsedData.title || parsedData.isbn || 'Unknown'}" selected.`,
        });
        return;
      }
      
      // Handle plain text barcodes (could be ISBN, book ID, etc.)
      if (text.length >= 8) {
        // Check if it looks like an ISBN (10 or 13 digits, possibly with hyphens)
        const cleanText = text.replace(/[-\s]/g, '');
        const isISBN = /^(97[89])?\d{9}[\dX]$/.test(cleanText) || /^\d{10}$/.test(cleanText);
        
        if (isISBN) {
          if (mode === 'student') {
            toast({
              title: "ISBN Detected",
              description: "This appears to be a book ISBN. Please scan a student ID.",
              variant: "destructive"
            });
            setTimeout(() => setIsProcessing(false), 1000);
            return;
          }
          
          const bookData = { 
            isbn: cleanText, 
            rawData: text, 
            type: 'book',
            scannedAt: new Date().toISOString() 
          };
          
          if (onBookScan) {
            onBookScan(bookData);
          } else {
            onScan(bookData);
          }
          onOpenChange(false);
          toast({
            title: "Book ISBN Scanned",
            description: `ISBN: ${cleanText}`,
          });
          return;
        }
      }
      
      // Generic barcode/text handling
      const genericData = { 
        rawData: text, 
        type: mode === 'student' ? 'student_code' : mode === 'book' ? 'book_code' : 'unknown',
        scannedAt: new Date().toISOString() 
      };
      
      if (mode === 'book' && onBookScan) {
        onBookScan(genericData);
      } else {
        onScan(genericData);
      }
      onOpenChange(false);
      toast({
        title: mode === 'universal' ? "Code Scanned" : `${mode === 'book' ? 'Book' : 'Student'} Code Scanned`,
        description: `Data: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      });
      
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process scanned data.",
        variant: "destructive"
      });
    }
    
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !codeReader.current) return;

    try {
      setIsProcessing(true);
      
      // Use the decodeFromImage method with the file blob URL
      const imageUrl = URL.createObjectURL(file);
      
      try {
        const result = await codeReader.current.decodeFromImage(imageUrl);
        handleScanResult(result.getText());
        URL.revokeObjectURL(imageUrl);
      } catch (decodeError) {
        // Fallback: try with canvas approach for better compatibility
        const img = new Image();
        
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            // Convert canvas to data URL and try decoding
            const dataUrl = canvas.toDataURL('image/png');
            const fallbackResult = await codeReader.current!.decodeFromImage(dataUrl);
            handleScanResult(fallbackResult.getText());
            URL.revokeObjectURL(imageUrl);
          } catch (fallbackError) {
            toast({
              title: "File Scan Failed",
              description: "Could not read barcode from image. Try a clearer image with better lighting.",
              variant: "destructive"
            });
            URL.revokeObjectURL(imageUrl);
          } finally {
            setIsProcessing(false);
          }
        };
        
        img.onerror = () => {
          toast({
            title: "Invalid Image",
            description: "Could not load the selected image file.",
            variant: "destructive"
          });
          URL.revokeObjectURL(imageUrl);
          setIsProcessing(false);
        };
        
        img.src = imageUrl;
        return; // Exit early to prevent setting isProcessing to false
      }
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "Failed to process the image file.",
        variant: "destructive"
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast({
        title: "No Input",
        description: "Please enter barcode data.",
        variant: "destructive"
      });
      return;
    }

    handleScanResult(manualInput.trim());
    setManualInput('');
  };

  // Handle keyboard input from external barcode readers
  const handleKeyboardInput = useCallback((e: KeyboardEvent) => {
    // Only process if scanner is open and not currently processing
    if (!open || isProcessing) return;
    
    // Ignore if user is typing in a text input
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as any).contentEditable === 'true'
    )) {
      return;
    }

    // Handle barcode reader input (typically sends Enter after data)
    if (e.key === 'Enter') {
      if (keyboardBuffer.trim().length > 3) { // Minimum length for valid barcode
        toast({
          title: "Barcode Reader Input Detected",
          description: `Processing: ${keyboardBuffer.substring(0, 30)}...`,
        });
        handleScanResult(keyboardBuffer.trim());
        setKeyboardBuffer('');
        return;
      }
    }
    
    // Build keyboard buffer for barcode readers
    if (e.key.length === 1 || e.key === 'Enter') {
      e.preventDefault();
      
      if (e.key === 'Enter') return; // Already handled above
      
      setKeyboardBuffer(prev => prev + e.key);
      
      // Clear buffer after timeout (barcode readers are fast)
      if (keyboardTimerRef.current) {
        clearTimeout(keyboardTimerRef.current);
      }
      
      keyboardTimerRef.current = setTimeout(() => {
        setKeyboardBuffer('');
      }, 100); // 100ms timeout - barcode readers scan much faster
    }
  }, [open, isProcessing, keyboardBuffer, handleScanResult, toast]);

  const switchCamera = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    stopScanner();
    if (scanMode === 'camera') {
      await startScanning(deviceId);
    }
  };

  const handleTabChange = (value: string) => {
    setScanMode(value as 'camera' | 'file' | 'manual');
    stopScanner();
  };

  useEffect(() => {
    if (open) {
      initializeScanner();
      // Add global keyboard listener for barcode readers
      document.addEventListener('keydown', handleKeyboardInput);
      // Focus hidden input to ensure we can capture keyboard events
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    } else {
      stopScanner();
      document.removeEventListener('keydown', handleKeyboardInput);
    }

    return () => {
      stopScanner();
      document.removeEventListener('keydown', handleKeyboardInput);
      if (keyboardTimerRef.current) {
        clearTimeout(keyboardTimerRef.current);
      }
    };
  }, [open, initializeScanner, handleKeyboardInput]);

  useEffect(() => {
    if (scanMode === 'camera' && selectedDevice && open) {
      startScanning(selectedDevice);
    } else {
      stopScanner();
    }
  }, [scanMode, selectedDevice, resolution, autoFocus, open]);

  const handleClose = () => {
    setManualInput('');
    setIsProcessing(false);
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Hidden input for barcode reader focus */}
        <input
          ref={hiddenInputRef}
          type="text"
          value=""
          onChange={() => {}} // Controlled by keyboard listener
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            opacity: 0, 
            pointerEvents: 'none' 
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            {title}
            {keyboardBuffer && (
              <Badge variant="secondary" className="ml-2">
                Reading: {keyboardBuffer.length} chars
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {description}
            {scanMode === 'camera' && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <ScanLine className="w-3 h-3 inline mr-1" />
                Barcode readers will work automatically - just scan!
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={scanMode} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Manual Input
            </TabsTrigger>
          </TabsList>

          {/* Camera Scanner */}
          <TabsContent value="camera" className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Enhanced scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary rounded-lg w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-primary animate-pulse opacity-80"></div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <CheckCircle className="w-12 h-12 text-green-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {scanning && <Badge variant="default">Scanning</Badge>}
                {isProcessing && <Badge variant="secondary">Processing</Badge>}
                {torchMode && <Badge variant="outline">Torch On</Badge>}
              </div>
            </div>

            {/* Camera Controls */}
            <div className="space-y-3">
              {/* Camera Selection */}
              {devices.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {devices.map((device, index) => (
                    <Button
                      key={device.deviceId}
                      variant={selectedDevice === device.deviceId ? "default" : "outline"}
                      size="sm"
                      onClick={() => switchCamera(device.deviceId)}
                      className="flex-1 min-w-0"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      {device.label || `Camera ${index + 1}`}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Scanner Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={resolution} onValueChange={(value: any) => setResolution(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="hd">HD (720p)</SelectItem>
                      <SelectItem value="fhd">Full HD (1080p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Focus Mode</Label>
                  <Button
                    variant={autoFocus ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoFocus(!autoFocus)}
                    className="w-full"
                  >
                    {autoFocus ? "Auto Focus" : "Manual Focus"}
                  </Button>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={scanning ? "destructive" : "default"}
                  onClick={() => scanning ? stopScanner() : startScanning(selectedDevice)}
                  className="flex-1"
                  disabled={!selectedDevice}
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
                
                <Button
                  variant="outline"
                  onClick={() => initializeScanner()}
                  disabled={scanning}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* File Upload */}
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select an image file containing a QR code or barcode
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mb-4"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Supports: JPG, PNG, GIF, BMP, WebP
              </div>
            </div>
          </TabsContent>

          {/* Manual Input */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="manual-input">Barcode/QR Code Data</Label>
              <Textarea
                id="manual-input"
                placeholder="Scan with external scanner or paste data here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleManualSubmit();
                  }
                }}
                className="min-h-[120px] font-mono text-sm"
                autoFocus
              />
              
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <ScanLine className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium mb-1">Universal Scanner Support:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Works with handheld barcode scanners</li>
                      <li>• Compatible with USB/wireless scanners</li>
                      <li>• Supports keyboard wedge input</li>
                      <li>• Scans student IDs and book codes</li>
                      <li>• Manual paste and typing supported</li>
                      <li>• Press Ctrl+Enter to submit</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Process Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Supports student IDs, book QR codes, ISBNs, and all major barcode formats.
            {scanMode === 'camera' && ' External barcode readers supported.'}
          </div>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};