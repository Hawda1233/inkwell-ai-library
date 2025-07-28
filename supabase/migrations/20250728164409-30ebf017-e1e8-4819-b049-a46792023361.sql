-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  isbn VARCHAR(13) UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  publication_year INTEGER,
  category TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  location_shelf TEXT,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student digital IDs table
CREATE TABLE public.student_digital_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL UNIQUE,
  student_number TEXT UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(student_id)
);

-- Create book transactions table
CREATE TABLE public.book_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('borrow', 'return', 'renew')),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  returned_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id)
);

-- Create library sessions table (for tracking student check-ins to library)
CREATE TABLE public.library_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'completed')),
  purpose TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_digital_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_sessions ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Student digital IDs policies
CREATE POLICY "Students can view their own digital ID" ON public.student_digital_ids 
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins can view all digital IDs" ON public.student_digital_ids 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can create digital IDs" ON public.student_digital_ids 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update digital IDs" ON public.student_digital_ids 
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Book transactions policies
CREATE POLICY "Students can view their own transactions" ON public.book_transactions 
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON public.book_transactions 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage transactions" ON public.book_transactions 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Library sessions policies
CREATE POLICY "Students can view their own sessions" ON public.library_sessions 
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can create their own sessions" ON public.library_sessions 
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update their own sessions" ON public.library_sessions 
  FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Admins can view all sessions" ON public.library_sessions 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_books_isbn ON public.books(isbn);
CREATE INDEX idx_books_title ON public.books(title);
CREATE INDEX idx_books_author ON public.books(author);
CREATE INDEX idx_student_digital_ids_student_id ON public.student_digital_ids(student_id);
CREATE INDEX idx_student_digital_ids_qr_code ON public.student_digital_ids(qr_code_data);
CREATE INDEX idx_book_transactions_student_id ON public.book_transactions(student_id);
CREATE INDEX idx_book_transactions_book_id ON public.book_transactions(book_id);
CREATE INDEX idx_book_transactions_status ON public.book_transactions(status);
CREATE INDEX idx_library_sessions_student_id ON public.library_sessions(student_id);
CREATE INDEX idx_library_sessions_status ON public.library_sessions(session_status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate student digital ID when profile is created
CREATE OR REPLACE FUNCTION public.generate_student_digital_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to auto-generate digital ID for new students
CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.generate_student_digital_id();

-- Function to update book availability when transaction occurs
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for book availability updates
CREATE TRIGGER on_book_transaction_change
  AFTER INSERT OR UPDATE ON public.book_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_availability();

-- Insert some sample books
INSERT INTO public.books (isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location_shelf) VALUES
('9780132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Prentice Hall', 2008, 'Technology', 5, 5, 'A1-001'),
('9780134685991', 'Effective Java', 'Joshua Bloch', 'Addison-Wesley', 2017, 'Technology', 3, 3, 'A1-002'),
('9780321125217', 'Domain-Driven Design', 'Eric Evans', 'Addison-Wesley', 2003, 'Technology', 2, 2, 'A1-003'),
('9780201633610', 'Design Patterns', 'Gang of Four', 'Addison-Wesley', 1994, 'Technology', 4, 4, 'A1-004'),
('9781593279509', 'Eloquent JavaScript', 'Marijn Haverbeke', 'No Starch Press', 2018, 'Technology', 6, 6, 'A1-005'),
('9780060935467', 'To Kill a Mockingbird', 'Harper Lee', 'Harper Perennial', 1960, 'Literature', 8, 8, 'B2-001'),
('9780141439518', 'Pride and Prejudice', 'Jane Austen', 'Penguin Classics', 1813, 'Literature', 5, 5, 'B2-002'),
('9780486282114', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Dover Publications', 1925, 'Literature', 7, 7, 'B2-003'),
('9780062315007', 'The Alchemist', 'Paulo Coelho', 'HarperOne', 1988, 'Fiction', 10, 10, 'C3-001'),
('9780439708180', 'Harry Potter and the Sorcerers Stone', 'J.K. Rowling', 'Scholastic', 1997, 'Fiction', 12, 12, 'C3-002');