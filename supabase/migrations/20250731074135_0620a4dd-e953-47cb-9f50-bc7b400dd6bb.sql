-- Fix security warnings by adding search_path to functions
CREATE OR REPLACE FUNCTION public.calculate_overdue_fines()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  transaction_record RECORD;
  days_overdue INTEGER;
  fine_amount DECIMAL(10,2);
  fine_per_day DECIMAL(10,2) := 1.00; -- Default $1 per day
  fines_created INTEGER := 0;
BEGIN
  -- Find all overdue active transactions that don't already have fines
  FOR transaction_record IN
    SELECT bt.id, bt.student_id, bt.due_date, bt.transaction_date
    FROM public.book_transactions bt
    WHERE bt.status = 'active'
      AND bt.transaction_type = 'borrow'
      AND bt.due_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.fines f 
        WHERE f.transaction_id = bt.id
      )
  LOOP
    -- Calculate days overdue
    days_overdue := CURRENT_DATE - transaction_record.due_date;
    fine_amount := days_overdue * fine_per_day;
    
    -- Create fine record
    INSERT INTO public.fines (
      transaction_id,
      student_id,
      fine_amount,
      days_overdue,
      fine_per_day,
      status
    ) VALUES (
      transaction_record.id,
      transaction_record.student_id,
      fine_amount,
      days_overdue,
      fine_per_day,
      'unpaid'
    );
    
    fines_created := fines_created + 1;
  END LOOP;
  
  RETURN fines_created;
END;
$$;

-- Fix function with search_path
CREATE OR REPLACE FUNCTION public.handle_book_return_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_reservation RECORD;
BEGIN
  -- When a book is returned, check if there are active reservations
  IF NEW.status = 'returned' AND OLD.status = 'active' AND NEW.transaction_type = 'borrow' THEN
    -- Find the next reservation in priority order
    SELECT * INTO next_reservation
    FROM public.book_reservations
    WHERE book_id = NEW.book_id
      AND status = 'active'
    ORDER BY priority_order ASC, reserved_at ASC
    LIMIT 1;
    
    -- If there's a reservation, mark it as fulfilled
    IF FOUND THEN
      UPDATE public.book_reservations
      SET status = 'fulfilled',
          fulfilled_at = now()
      WHERE id = next_reservation.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix function with search_path
CREATE OR REPLACE FUNCTION public.set_reservation_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  max_priority INTEGER;
BEGIN
  -- Get current max priority for this book
  SELECT COALESCE(MAX(priority_order), 0) INTO max_priority
  FROM public.book_reservations
  WHERE book_id = NEW.book_id
    AND status = 'active';
  
  -- Set new reservation priority
  NEW.priority_order := max_priority + 1;
  
  RETURN NEW;
END;
$$;