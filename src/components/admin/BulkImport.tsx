import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Loader2,
  X
} from "lucide-react";

interface BulkImportProps {
  onImportComplete: () => void;
}

interface CSVBook {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  publication_year: string;
  total_copies: string;
  location_shelf: string;
  description: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const BulkImport = ({ onImportComplete }: BulkImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<CSVBook[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const headers = [
      "title", "author", "isbn", "publisher", "category", 
      "publication_year", "total_copies", "location_shelf", "description"
    ];
    
    const sampleData = [
      [
        "The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", 
        "Scribner", "Fiction", "1925", "3", "A-12", 
        "A classic American novel about the Jazz Age"
      ],
      [
        "To Kill a Mockingbird", "Harper Lee", "9780061120084", 
        "J.B. Lippincott & Co.", "Fiction", "1960", "2", "A-15", 
        "A gripping tale of racial injustice and childhood innocence"
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): CSVBook[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const data: CSVBook[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length >= 2) { // At least title and author required
        const book: CSVBook = {
          title: values[headers.indexOf('title')] || '',
          author: values[headers.indexOf('author')] || '',
          isbn: values[headers.indexOf('isbn')] || '',
          publisher: values[headers.indexOf('publisher')] || '',
          category: values[headers.indexOf('category')] || '',
          publication_year: values[headers.indexOf('publication_year')] || '',
          total_copies: values[headers.indexOf('total_copies')] || '1',
          location_shelf: values[headers.indexOf('location_shelf')] || '',
          description: values[headers.indexOf('description')] || ''
        };
        
        if (book.title && book.author) {
          data.push(book);
        }
      }
    }

    return data;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const books = parseCSV(text);
      setPreviewData(books);
      
      if (books.length === 0) {
        toast({
          title: "No Valid Data",
          description: "No valid book entries found in the CSV file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const validateBook = (book: CSVBook): string[] => {
    const errors: string[] = [];
    
    if (!book.title.trim()) errors.push("Title is required");
    if (!book.author.trim()) errors.push("Author is required");
    
    if (book.publication_year && (isNaN(parseInt(book.publication_year)) || parseInt(book.publication_year) < 1000)) {
      errors.push("Invalid publication year");
    }
    
    if (book.total_copies && (isNaN(parseInt(book.total_copies)) || parseInt(book.total_copies) < 1)) {
      errors.push("Total copies must be at least 1");
    }
    
    return errors;
  };

  const importBooks = async () => {
    if (!previewData.length) return;

    setImporting(true);
    setProgress(0);
    setImportResult(null);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < previewData.length; i++) {
      const book = previewData[i];
      const validationErrors = validateBook(book);
      
      if (validationErrors.length > 0) {
        result.failed++;
        result.errors.push(`Row ${i + 2}: ${validationErrors.join(', ')}`);
        setProgress(((i + 1) / previewData.length) * 100);
        continue;
      }

      try {
        // Check for duplicate ISBN if provided
        if (book.isbn?.trim()) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('isbn', book.isbn.trim())
            .maybeSingle();

          if (existingBook) {
            result.failed++;
            result.errors.push(`Row ${i + 2}: Book with ISBN ${book.isbn} already exists`);
            setProgress(((i + 1) / previewData.length) * 100);
            continue;
          }
        }

        const { error } = await supabase
          .from('books')
          .insert([{
            title: book.title.trim(),
            author: book.author.trim(),
            isbn: book.isbn?.trim() || null,
            publisher: book.publisher?.trim() || null,
            category: book.category?.trim() || null,
            description: book.description?.trim() || null,
            publication_year: book.publication_year ? parseInt(book.publication_year) : null,
            total_copies: parseInt(book.total_copies) || 1,
            available_copies: parseInt(book.total_copies) || 1,
            location_shelf: book.location_shelf?.trim() || null,
            cover_image_url: null
          }]);

        if (error) {
          result.failed++;
          result.errors.push(`Row ${i + 2}: ${error.message}`);
        } else {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${i + 2}: ${error.message}`);
      }

      setProgress(((i + 1) / previewData.length) * 100);
    }

    setImportResult(result);
    setImporting(false);

    if (result.success > 0) {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success} books. ${result.failed} failed.`,
      });
      onImportComplete();
    }
  };

  const resetImport = () => {
    setCsvFile(null);
    setPreviewData([]);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload a CSV file with book information. Make sure your CSV includes headers: title, author, isbn, publisher, category, publication_year, total_copies, location_shelf, description
        </AlertDescription>
      </Alert>

      {/* Download Template */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </Button>
        <span className="text-sm text-muted-foreground">
          Download a sample CSV file to see the correct format
        </span>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select a CSV file containing book information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              disabled={importing}
            />
            
            {csvFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{csvFile.name}</span>
                  <Badge variant="secondary">{previewData.length} books</Badge>
                </div>
                {!importing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImport}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewData.length > 0 && !importing && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>
              {previewData.length} books ready to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Title</th>
                      <th className="p-2 text-left">Author</th>
                      <th className="p-2 text-left">ISBN</th>
                      <th className="p-2 text-left">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((book, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{book.title}</td>
                        <td className="p-2">{book.author}</td>
                        <td className="p-2">{book.isbn || '-'}</td>
                        <td className="p-2">{book.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <div className="p-2 text-center text-muted-foreground border-t">
                    ... and {previewData.length - 5} more books
                  </div>
                )}
              </div>
              
              <Button
                onClick={importBooks}
                className="w-full"
                disabled={importing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {previewData.length} Books
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing books...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processing {Math.round(progress)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-green-700">Successfully Imported</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Import Errors
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={resetImport}
                className="w-full"
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};