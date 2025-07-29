-- Fix data integrity issue where available_copies > total_copies
UPDATE books 
SET available_copies = total_copies 
WHERE available_copies > total_copies;

-- Add a constraint to prevent this from happening again
ALTER TABLE books 
ADD CONSTRAINT books_available_copies_check 
CHECK (available_copies <= total_copies AND available_copies >= 0);