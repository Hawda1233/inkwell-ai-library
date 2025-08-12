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
// PDF.js support for parsing book lists from PDFs
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
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

// Parse a PDF into CSVBook[] using simple heuristics and Marathi-friendly labels
const parsePDF = async (arrayBuffer: ArrayBuffer): Promise<CSVBook[]> => {
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let current = "";
    for (const item of content.items as any[]) {
      const str = (item.str || "").toString();
      if (str) current += (current ? " " : "") + str;
      if (item.hasEOL) {
        lines.push(current.trim());
        current = "";
      }
    }
    if (current.trim()) lines.push(current.trim());
    lines.push(""); // page break -> blank line
  }

  const labelAliases: Record<keyof CSVBook, string[]> = {
    title: ["title", "book title", "शीर्षक"],
    author: ["author", "लेखक"],
    isbn: ["isbn"],
    publisher: ["publisher", "प्रकाशक"],
    category: ["category", "श्रेणी", "विभाग"],
    publication_year: ["publication year", "year", "वर्ष"],
    total_copies: ["total copies", "copies", "प्रती"],
    location_shelf: ["shelf", "location", "रॅक", "शेल्फ"],
    description: ["description", "वर्णन"],
  } as any;

  const toKey = (k: string): keyof CSVBook | null => {
    const key = k.trim().toLowerCase();
    for (const field of Object.keys(labelAliases) as (keyof CSVBook)[]) {
      if (labelAliases[field].some(a => key.includes(a))) return field;
    }
    return null;
  };

  const text = lines.join("\n");
  let blocks = text.split(/\n\s*\n+/); // blank-line separated blocks
  if (blocks.length <= 1) {
    // Fallback: treat each non-empty line as a potential record
    blocks = lines.filter(l => l.trim().length > 0);
  }

  const isbnRegex = /(\d[\d-]{8,16}[\dxX])/;
  const yearRegex = /\b(1[5-9]\d{2}|20\d{2}|2100)\b/;

  const parsed: CSVBook[] = [];

  const parseBlock = (block: string): CSVBook | null => {
    const lns = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (!lns.length) return null;

    const rec: Partial<CSVBook> = {};

    // key: value lines
    for (const l of lns) {
      const parts = l.split(":");
      if (parts.length > 1) {
        const key = toKey(parts[0]);
        const value = parts.slice(1).join(":").trim();
        if (key) (rec as any)[key] = value;
      }
      // attempt to extract isbn/year anywhere
      if (!rec.isbn) {
        const m = l.match(isbnRegex);
        if (m) rec.isbn = m[1].replace(/-/g, "");
      }
      if (!rec.publication_year) {
        const y = l.match(yearRegex)?.[0];
        if (y) rec.publication_year = y;
      }
      if (!rec.total_copies && /(copies|प्रती)/i.test(l)) {
        const n = l.match(/\d+/)?.[0];
        if (n) rec.total_copies = n;
      }
      if (!rec.publisher && /(publisher|प्रकाशक)/i.test(l)) {
        const v = l.split(/publisher|प्रकाशक/i)[1]?.replace(/[:\-]/, "").trim();
        if (v) rec.publisher = v;
      }
    }

    // heuristics for title/author if missing
    if (!rec.title || !rec.author) {
      const first = lns[0];
      const byMatch = first.match(/(.+)\s+by\s+(.+)/i);
      if (byMatch) {
        rec.title = rec.title || byMatch[1].trim();
        rec.author = rec.author || byMatch[2].trim();
      } else {
        rec.title = rec.title || first;
        rec.author = rec.author || lns[1] || "Unknown";
      }
    }

    const out: CSVBook = {
      title: (rec.title || "").trim(),
      author: (rec.author || "Unknown").trim(),
      isbn: (rec.isbn || "").replace(/[^0-9Xx]/g, ""),
      publisher: rec.publisher?.trim() || "",
      category: rec.category?.trim() || "",
      publication_year: rec.publication_year?.trim() || "",
      total_copies: rec.total_copies?.trim() || "1",
      location_shelf: rec.location_shelf?.trim() || "",
      description: rec.description?.trim() || lns.slice(2).join(" ") || "",
    };

    if (!out.title) return null;
    if (!out.author) out.author = "Unknown";
    return out;
  };

  for (const b of blocks) {
    const book = parseBlock(b);
    if (book && book.title && book.author) parsed.push(book);
  }

  // de-dupe by title+author within file
  const seen = new Set<string>();
  const unique: CSVBook[] = [];
  for (const b of parsed) {
    const key = `${b.title.toLowerCase()}|${b.author.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); unique.push(b); }
  }
  return unique;
};

const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setCsvFile(file);

  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const buf = await file.arrayBuffer();
      const books = await parsePDF(buf);
      setPreviewData(books);
      if (!books.length) {
        toast({ title: "No data found", description: "We couldn't detect books in this PDF.", variant: "destructive" });
      }
    } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const books = parseCSV(text);
      setPreviewData(books);
      if (!books.length) {
        toast({ title: "No Valid Data", description: "No valid book entries found in the CSV file", variant: "destructive" });
      }
    } else {
      toast({ title: "Unsupported file", description: "Upload a CSV or PDF file", variant: "destructive" });
    }
  } catch (e: any) {
    toast({ title: "File read failed", description: e.message || 'Unknown error', variant: "destructive" });
  }
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
          Upload a CSV or PDF with book information. For best results include: title, author, isbn, publisher, category, publication_year, total_copies, location_shelf, description
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
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select a CSV or PDF containing book information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,application/pdf,text/csv"
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
                disabled={importing || previewData.length === 0}
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