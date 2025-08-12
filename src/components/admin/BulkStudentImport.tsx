import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Download, Loader2, X } from "lucide-react";

// PDF.js
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
// Configure worker
// @ts-ignore
GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

interface StudentRow {
  full_name: string;
  email?: string;
  course_level: 'UG' | 'PG';
  program: 'BCom' | 'MCom' | 'BBA' | 'BCA' | 'BA' | 'BEd' | 'DEd' | 'BSc' | 'MSc';
  year: number;
  division: string;
  roll_number: string;
  student_number?: string;
}

export const BulkStudentImport = ({ onComplete }: { onComplete: () => void }) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

const downloadTemplate = () => {
    const headers = ["full_name","email","course_level","program","year","division","roll_number","student_number"];
    const rows = [
      ["Alice Johnson","alice@example.com","UG","BCom","1","A","123",""],
      ["Bob Kumar","","PG","MCom","2","B","45","STU-00045"]
    ];
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

const parseCSV = (text: string): StudentRow[] => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headerMap = lines[0].split(",").map(h => h.replace(/"/g, '').trim().toLowerCase());
    const idx = (key: string) => headerMap.indexOf(key);
    const out: StudentRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.replace(/"/g, '').trim());
      const row: StudentRow = {
        full_name: values[idx('full_name')] || '',
        email: values[idx('email')] || undefined,
        course_level: (values[idx('course_level')] || 'UG').toUpperCase() as 'UG' | 'PG',
        program: (values[idx('program')] || 'BCom') as any,
        year: Number(values[idx('year')] || '1'),
        division: values[idx('division')] || '',
        roll_number: values[idx('roll_number')] || '',
        student_number: values[idx('student_number')] || undefined,
      };
      if (row.full_name && row.program && row.division && row.roll_number && row.year) out.push(row);
    }
    return out;
  };

  const parsePDF = async (arrayBuffer: ArrayBuffer): Promise<StudentRow[]> => {
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = content.items.map((it: any) => (it.str || '')).filter(Boolean);
      text += strings.join(' ') + '\n';
    }
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const found = text.match(emailRegex) || [];
    const lines = text.split(/\n+/);
    const rows: StudentRow[] = [];
    const seen = new Set<string>();

    for (const ln of lines) {
      const emailMatch = ln.match(emailRegex)?.[0];
      if (!emailMatch) continue;
      const before = ln.split(emailMatch)[0].trim();
      const full_name = before.split(/[-,|]/)[0].trim() || emailMatch.split('@')[0];
      const email = emailMatch;
      if (!seen.has(email)) {
        rows.push({ 
          full_name, 
          email, 
          course_level: 'UG',
          program: 'BCom',
          year: 1,
          division: '',
          roll_number: '',
        });
        seen.add(email);
      }
    }

    // Fallback if no line-wise parsing worked
    if (rows.length === 0) {
      for (const email of found) {
        const nameGuess = email.split('@')[0].replace(/[._-]/g, ' ');
        if (!seen.has(email)) {
          rows.push({ 
            full_name: nameGuess, 
            email,
            course_level: 'UG',
            program: 'BCom',
            year: 1,
            division: '',
            roll_number: '',
          });
          seen.add(email);
        }
      }
    }

    return rows;
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview([]);

    try {
      if (f.type === 'text/csv' || f.name.endsWith('.csv')) {
        const text = await f.text();
        const rows = parseCSV(text);
        setPreview(rows);
        toast({ title: "Parsed CSV", description: `${rows.length} students found.` });
      } else if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
        const buf = await f.arrayBuffer();
        const rows = await parsePDF(buf);
        setPreview(rows);
        toast({ title: "Parsed PDF", description: `${rows.length} students found.` });
      } else {
        toast({ title: "Unsupported file", description: "Upload a CSV or PDF", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Parse error", description: err.message || 'Failed to read file', variant: "destructive" });
    }
  };

  const startImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-students', {
        body: { students: preview },
      });
      if (error) throw error;
      const { success, failed, errors } = data || {};
      toast({ title: "Import complete", description: `${success} added, ${failed} failed.` });
      if (errors?.length) {
        console.warn('Bulk import errors:', errors);
      }
      onComplete();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message || 'Unknown error', variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload a CSV or PDF containing students. We detect emails automatically from PDFs. Recommended columns for CSV: full_name, email.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Sample CSV
        </Button>
        <span className="text-sm text-muted-foreground">Use the template for best results</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Choose a CSV or PDF with student information</CardDescription>
        </CardHeader>
        <CardContent>
          <Input ref={fileRef} type="file" accept=".csv,.pdf,application/pdf,text/csv" onChange={onFileChange} />
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>{preview.length} students detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Full Name</th>
                    <th className="p-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{s.full_name}</td>
                      <td className="p-2">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={startImport} disabled={importing} className="flex-1">
                <Upload className="w-4 h-4 mr-2" /> Import {preview.length} Students
              </Button>
              <Button variant="outline" onClick={reset} disabled={importing}>
                <X className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>

            {importing && (
              <div className="mt-4">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground mt-2">Importing...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
