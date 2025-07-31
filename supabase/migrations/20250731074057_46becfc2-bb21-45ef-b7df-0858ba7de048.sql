-- Create fines table for overdue book management
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  student_id UUID NOT NULL,
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  fine_per_day DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'waived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  waived_at TIMESTAMP WITH TIME ZONE NULL,
  waived_by UUID NULL
);

-- Enable RLS on fines table
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Create policies for fines
CREATE POLICY "Admins can manage fines" 
ON public.fines 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own fines" 
ON public.fines 
FOR SELECT 
USING (student_id = auth.uid());

-- Create book reservations table
CREATE TABLE public.book_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  student_id UUID NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  priority_order INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS on reservations table
ALTER TABLE public.book_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations
CREATE POLICY "Admins can manage reservations" 
ON public.book_reservations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own reservations" 
ON public.book_reservations 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can create reservations" 
ON public.book_reservations 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can cancel their own reservations" 
ON public.book_reservations 
FOR UPDATE 
USING (student_id = auth.uid()) 
WITH CHECK (student_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_fines_transaction_id ON public.fines(transaction_id);
CREATE INDEX idx_fines_student_id ON public.fines(student_id);
CREATE INDEX idx_fines_status ON public.fines(status);

CREATE INDEX idx_reservations_book_id ON public.book_reservations(book_id);
CREATE INDEX idx_reservations_student_id ON public.book_reservations(student_id);
CREATE INDEX idx_reservations_status ON public.book_reservations(status);
CREATE INDEX idx_reservations_priority ON public.book_reservations(priority_order);

-- Create function to calculate and create fines for overdue books
CREATE OR REPLACE FUNCTION public.calculate_overdue_fines()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to update reservation priority when books are returned
CREATE OR REPLACE FUNCTION public.handle_book_return_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for handling reservations on book return
CREATE TRIGGER handle_reservations_on_return
  AFTER UPDATE ON public.book_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_book_return_reservations();

-- Create function to manage reservation priority
CREATE OR REPLACE FUNCTION public.set_reservation_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for setting reservation priority
CREATE TRIGGER set_reservation_priority_trigger
  BEFORE INSERT ON public.book_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reservation_priority();

-- Add updated_at trigger for fines
CREATE TRIGGER update_fines_updated_at
  BEFORE UPDATE ON public.fines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();