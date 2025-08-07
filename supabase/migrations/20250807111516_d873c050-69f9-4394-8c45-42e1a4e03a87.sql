-- Add new fields to books table for acquisition and detailed information
ALTER TABLE public.books ADD COLUMN acquisition_date DATE;
ALTER TABLE public.books ADD COLUMN accession_number TEXT UNIQUE;
ALTER TABLE public.books ADD COLUMN edition TEXT;
ALTER TABLE public.books ADD COLUMN pages INTEGER;
ALTER TABLE public.books ADD COLUMN volume TEXT;
ALTER TABLE public.books ADD COLUMN source TEXT;
ALTER TABLE public.books ADD COLUMN bill_number TEXT;
ALTER TABLE public.books ADD COLUMN bill_date DATE;
ALTER TABLE public.books ADD COLUMN cost DECIMAL(10,2);
ALTER TABLE public.books ADD COLUMN withdrawal_remarks TEXT;

-- Add index for accession number for faster lookups
CREATE INDEX idx_books_accession_number ON public.books(accession_number);

-- Add comment for clarity
COMMENT ON COLUMN public.books.acquisition_date IS 'Date when the book was acquired/entered into the library';
COMMENT ON COLUMN public.books.accession_number IS 'Unique accession number for the book entry';
COMMENT ON COLUMN public.books.edition IS 'Edition information of the book';
COMMENT ON COLUMN public.books.pages IS 'Total number of pages in the book';
COMMENT ON COLUMN public.books.volume IS 'Volume number if book is part of a series';
COMMENT ON COLUMN public.books.source IS 'Source of acquisition (purchase/donation/etc)';
COMMENT ON COLUMN public.books.bill_number IS 'Purchase bill number';
COMMENT ON COLUMN public.books.bill_date IS 'Date of purchase bill';
COMMENT ON COLUMN public.books.cost IS 'Cost/price of the book';
COMMENT ON COLUMN public.books.withdrawal_remarks IS 'Remarks when book is withdrawn or removed';