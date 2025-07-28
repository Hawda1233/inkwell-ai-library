-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.generate_student_digital_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  student_num TEXT;
  qr_data TEXT;
  user_role TEXT;
BEGIN
  -- Check if user is a student
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = NEW.id AND role = 'student';
  
  -- Only create digital ID for students
  IF user_role = 'student' THEN
    -- Generate unique student number (format: YEAR + random 6 digits)
    student_num := EXTRACT(YEAR FROM NOW())::TEXT || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.student_digital_ids WHERE student_number = student_num) LOOP
      student_num := EXTRACT(YEAR FROM NOW())::TEXT || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    END LOOP;
    
    -- Create QR code data (JSON format with student info)
    qr_data := json_build_object(
      'student_id', NEW.id,
      'student_number', student_num,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'issued_at', NOW()
    )::TEXT;
    
    -- Insert digital ID record
    INSERT INTO public.student_digital_ids (student_id, qr_code_data, student_number)
    VALUES (NEW.id, qr_data, student_num);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.transaction_type = 'borrow' AND NEW.status = 'active' THEN
    -- Decrease available copies when book is borrowed
    UPDATE public.books 
    SET available_copies = available_copies - 1 
    WHERE id = NEW.book_id AND available_copies > 0;
  ELSIF NEW.transaction_type = 'return' OR (OLD.status = 'active' AND NEW.status = 'returned') THEN
    -- Increase available copies when book is returned
    UPDATE public.books 
    SET available_copies = available_copies + 1 
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;