-- Add rack number and row/shelf number fields to books table for better location management
ALTER TABLE public.books 
ADD COLUMN rack_number text,
ADD COLUMN row_shelf_number text;

-- Add a comment to explain the location fields
COMMENT ON COLUMN public.books.rack_number IS 'The rack/section where the book is stored';
COMMENT ON COLUMN public.books.row_shelf_number IS 'The specific row or shelf number within the rack';
COMMENT ON COLUMN public.books.location_shelf IS 'Legacy location field - can be used for additional location notes';