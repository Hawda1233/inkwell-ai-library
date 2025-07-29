-- Check if update_book_availability trigger exists and recreate it properly
DROP TRIGGER IF EXISTS book_transaction_trigger ON public.book_transactions;

-- Recreate the function to handle book availability updates
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new borrow transaction)
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'borrow' AND NEW.status = 'active' THEN
      UPDATE public.books 
      SET available_copies = available_copies - 1 
      WHERE id = NEW.book_id AND available_copies > 0;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (status changes, returns, etc.)
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from active to returned for borrow transaction
    IF OLD.transaction_type = 'borrow' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
      UPDATE public.books 
      SET available_copies = available_copies + 1 
      WHERE id = NEW.book_id;
    END IF;
    
    -- If a borrow transaction was cancelled/deactivated
    IF OLD.transaction_type = 'borrow' AND OLD.status = 'active' AND NEW.status != 'active' AND NEW.status != 'returned' THEN
      UPDATE public.books 
      SET available_copies = available_copies + 1 
      WHERE id = NEW.book_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (if transaction is deleted, restore availability)
  IF TG_OP = 'DELETE' THEN
    IF OLD.transaction_type = 'borrow' AND OLD.status = 'active' THEN
      UPDATE public.books 
      SET available_copies = available_copies + 1 
      WHERE id = OLD.book_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER book_transaction_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.book_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_book_availability();