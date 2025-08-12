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
import Papa from "papaparse";

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
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\uFEFF/, '').replace(/"/g, '').trim().toLowerCase(),
  });

  const mapField = (row: Record<string, string>, keys: string[]) => {
    for (const key of keys) {
      const val = (row as any)[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return '';
  };

  const books: CSVBook[] = (data as any[]).map((row) => ({
    title: mapField(row, ['title', 'book_title']),
    author: mapField(row, ['author', 'authors', 'author1']),
    isbn: mapField(row, ['isbn']),
    publisher: mapField(row, ['publisher']),
    category: mapField(row, ['category']),
    publication_year: mapField(row, ['publication_year', 'year', 'published_year']),
    total_copies: mapField(row, ['total_copies', 'copies', 'stock']) || '1',
    location_shelf: mapField(row, ['location_shelf', 'shelf', 'location']),
    description: mapField(row, ['description', 'summary'])
  }));

  return books.filter(b => b.title && b.author);
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

  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const total = previewData.length;
  let processed = 0;

  const items = previewData.map((book, idx) => ({ book, row: idx + 2 }));

  // Validate and dedupe ISBN within file
  const valid: typeof items = [];
  const seenIsbn = new Set<string>();
  for (const item of items) {
    const errs = validateBook(item.book);
    if (item.book.isbn && item.book.isbn.trim()) {
      const isbn = item.book.isbn.trim();
      if (seenIsbn.has(isbn)) {
        errs.push(`Duplicate ISBN in file: ${isbn}`);
      } else {
        seenIsbn.add(isbn);
      }
    }

    if (errs.length) {
      result.failed++;
      result.errors.push(`Row ${item.row}: ${errs.join(', ')}`);
      processed++;
      setProgress((processed / total) * 100);
    } else {
      valid.push(item);
    }
  }

  // Check duplicates by ISBN in database
  let toInsert = valid;
  const isbnList = Array.from(new Set(valid.map(v => v.book.isbn?.trim()).filter(Boolean) as string[]));
  if (isbnList.length) {
    const { data: existingIsbns, error: existingErr } = await supabase
      .from('books')
      .select('isbn')
      .in('isbn', isbnList);

    if (!existingErr && existingIsbns) {
      const existingSet = new Set(existingIsbns.map((r: any) => (r.isbn as string).trim()));
      const filtered: typeof valid = [];
      for (const item of valid) {
        const isbn = item.book.isbn?.trim();
        if (isbn && existingSet.has(isbn)) {
          result.failed++;
          result.errors.push(`Row ${item.row}: Book with ISBN ${isbn} already exists`);
          processed++;
          setProgress((processed / total) * 100);
        } else {
          filtered.push(item);
        }
      }
      toInsert = filtered;
    }
  }

  const mapToDb = (b: CSVBook) => ({
    title: b.title.trim(),
    author: b.author.trim(),
    isbn: b.isbn?.trim() || null,
    publisher: b.publisher?.trim() || null,
    category: b.category?.trim() || null,
    description: b.description?.trim() || null,
    publication_year: b.publication_year ? parseInt(b.publication_year) : null,
    total_copies: parseInt(b.total_copies) || 1,
    available_copies: parseInt(b.total_copies) || 1,
    location_shelf: b.location_shelf?.trim() || null,
    cover_image_url: null
  });

  const CHUNK_SIZE = 100;

  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const batchItems = toInsert.slice(i, i + CHUNK_SIZE);
    const batch = batchItems.map(it => mapToDb(it.book));
    try {
      const { error } = await supabase.from('books').insert(batch);
      if (error) {
        // Fallback per-row to capture individual errors
        for (const it of batchItems) {
          const { error: rowErr } = await supabase.from('books').insert([mapToDb(it.book)]);
          if (rowErr) {
            result.failed++;
            result.errors.push(`Row ${it.row}: ${rowErr.message}`);
          } else {
            result.success++;
          }
          processed++;
          setProgress((processed / total) * 100);
        }
      } else {
        result.success += batch.length;
        processed += batch.length;
        setProgress((processed / total) * 100);
      }
    } catch (e: any) {
      // Unexpected failure, fallback per-row
      for (const it of batchItems) {
        try {
          const { error: rowErr } = await supabase.from('books').insert([mapToDb(it.book)]);
          if (rowErr) {
            result.failed++;
            result.errors.push(`Row ${it.row}: ${rowErr.message}`);
          } else {
            result.success++;
          }
        } catch (err: any) {
          result.failed++;
          result.errors.push(`Row ${it.row}: ${err.message}`);
        } finally {
          processed++;
          setProgress((processed / total) * 100);
        }
      }
    }
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