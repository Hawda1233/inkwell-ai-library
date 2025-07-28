-- First, let's add more realistic student data
-- Create additional student profiles (these will be students)
INSERT INTO public.profiles (id, email, full_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alice.smith@university.edu', 'Alice Smith'),
('550e8400-e29b-41d4-a716-446655440002', 'bob.johnson@university.edu', 'Bob Johnson'),
('550e8400-e29b-41d4-a716-446655440003', 'carol.williams@university.edu', 'Carol Williams'),
('550e8400-e29b-41d4-a716-446655440004', 'david.brown@university.edu', 'David Brown'),
('550e8400-e29b-41d4-a716-446655440005', 'emma.davis@university.edu', 'Emma Davis'),
('550e8400-e29b-41d4-a716-446655440006', 'frank.miller@university.edu', 'Frank Miller'),
('550e8400-e29b-41d4-a716-446655440007', 'grace.wilson@university.edu', 'Grace Wilson'),
('550e8400-e29b-41d4-a716-446655440008', 'henry.moore@university.edu', 'Henry Moore');

-- Add student roles for the new profiles
INSERT INTO public.user_roles (user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'student'),
('550e8400-e29b-41d4-a716-446655440002', 'student'),
('550e8400-e29b-41d4-a716-446655440003', 'student'),
('550e8400-e29b-41d4-a716-446655440004', 'student'),
('550e8400-e29b-41d4-a716-446655440005', 'student'),
('550e8400-e29b-41d4-a716-446655440006', 'student'),
('550e8400-e29b-41d4-a716-446655440007', 'student'),
('550e8400-e29b-41d4-a716-446655440008', 'student');

-- Create digital IDs for the new students
INSERT INTO public.student_digital_ids (student_id, qr_code_data, student_number) VALUES
('550e8400-e29b-41d4-a716-446655440001', '{"student_id":"550e8400-e29b-41d4-a716-446655440001","student_number":"2025001234","email":"alice.smith@university.edu","full_name":"Alice Smith","issued_at":"2025-01-15T10:00:00Z"}', '2025001234'),
('550e8400-e29b-41d4-a716-446655440002', '{"student_id":"550e8400-e29b-41d4-a716-446655440002","student_number":"2025001235","email":"bob.johnson@university.edu","full_name":"Bob Johnson","issued_at":"2025-01-16T10:00:00Z"}', '2025001235'),
('550e8400-e29b-41d4-a716-446655440003', '{"student_id":"550e8400-e29b-41d4-a716-446655440003","student_number":"2025001236","email":"carol.williams@university.edu","full_name":"Carol Williams","issued_at":"2025-01-17T10:00:00Z"}', '2025001236'),
('550e8400-e29b-41d4-a716-446655440004', '{"student_id":"550e8400-e29b-41d4-a716-446655440004","student_number":"2025001237","email":"david.brown@university.edu","full_name":"David Brown","issued_at":"2025-01-18T10:00:00Z"}', '2025001237'),
('550e8400-e29b-41d4-a716-446655440005', '{"student_id":"550e8400-e29b-41d4-a716-446655440005","student_number":"2025001238","email":"emma.davis@university.edu","full_name":"Emma Davis","issued_at":"2025-01-19T10:00:00Z"}', '2025001238'),
('550e8400-e29b-41d4-a716-446655440006', '{"student_id":"550e8400-e29b-41d4-a716-446655440006","student_number":"2025001239","email":"frank.miller@university.edu","full_name":"Frank Miller","issued_at":"2025-01-20T10:00:00Z"}', '2025001239'),
('550e8400-e29b-41d4-a716-446655440007', '{"student_id":"550e8400-e29b-41d4-a716-446655440007","student_number":"2025001240","email":"grace.wilson@university.edu","full_name":"Grace Wilson","issued_at":"2025-01-21T10:00:00Z"}', '2025001240'),
('550e8400-e29b-41d4-a716-446655440008', '{"student_id":"550e8400-e29b-41d4-a716-446655440008","student_number":"2025001241","email":"henry.moore@university.edu","full_name":"Henry Moore","issued_at":"2025-01-22T10:00:00Z"}', '2025001241');

-- Add more books to the catalog
INSERT INTO public.books (isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location_shelf) VALUES
('9780131103627', 'The C Programming Language', 'Brian Kernighan, Dennis Ritchie', 'Prentice Hall', 1988, 'Technology', 4, 3, 'A1-006'),
('9780596009205', 'Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', 'O''Reilly Media', 2004, 'Technology', 3, 2, 'A1-007'),
('9781449331818', 'Learning Python', 'Mark Lutz', 'O''Reilly Media', 2013, 'Technology', 5, 4, 'A1-008'),
('9780135957059', 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, 'Technology', 4, 3, 'A1-009'),
('9780735619670', 'Code Complete', 'Steve McConnell', 'Microsoft Press', 2004, 'Technology', 3, 2, 'A1-010'),
('9780553213119', 'Foundation', 'Isaac Asimov', 'Bantam Books', 1991, 'Science Fiction', 6, 5, 'C3-003'),
('9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 2012, 'Fantasy', 8, 6, 'C3-004'),
('9780439023481', 'The Hunger Games', 'Suzanne Collins', 'Scholastic', 2008, 'Fiction', 7, 5, 'C3-005'),
('9780452284234', 'Brave New World', 'Aldous Huxley', 'Harper Perennial', 2006, 'Science Fiction', 5, 4, 'C3-006'),
('9780062073488', 'And Then There Were None', 'Agatha Christie', 'William Morrow', 2011, 'Mystery', 4, 3, 'D4-001'),
('9780385534260', 'The Fault in Our Stars', 'John Green', 'Dutton Books', 2012, 'Young Adult', 6, 4, 'D4-002'),
('9780345391803', 'The Hitchhiker''s Guide to the Galaxy', 'Douglas Adams', 'Del Rey', 1995, 'Science Fiction', 5, 4, 'D4-003');

-- Create realistic book transactions (borrowing history)
INSERT INTO public.book_transactions (student_id, book_id, transaction_type, transaction_date, due_date, status, processed_by) VALUES
-- Active borrowings
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.books WHERE isbn = '9780132350884'), 'borrow', '2025-01-20T09:00:00Z', '2025-02-03T09:00:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.books WHERE isbn = '9780131103627'), 'borrow', '2025-01-22T10:30:00Z', '2025-02-05T10:30:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.books WHERE isbn = '9780134685991'), 'borrow', '2025-01-25T14:15:00Z', '2025-02-08T14:15:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM public.books WHERE isbn = '9780596009205'), 'borrow', '2025-01-26T11:45:00Z', '2025-02-09T11:45:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM public.books WHERE isbn = '9781449331818'), 'borrow', '2025-01-27T16:20:00Z', '2025-02-10T16:20:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM public.books WHERE isbn = '9780735619670'), 'borrow', '2025-01-28T13:10:00Z', '2025-02-11T13:10:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),

-- Some overdue books
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM public.books WHERE isbn = '9780135957059'), 'borrow', '2025-01-10T10:00:00Z', '2025-01-24T10:00:00Z', 'overdue', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM public.books WHERE isbn = '9780060935467'), 'borrow', '2025-01-12T15:30:00Z', '2025-01-26T15:30:00Z', 'overdue', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),

-- Returned books (transaction history)
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.books WHERE isbn = '9780141439518'), 'borrow', '2025-01-05T09:00:00Z', '2025-01-19T09:00:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.books WHERE isbn = '9780141439518'), 'return', '2025-01-18T14:30:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.books WHERE isbn = '9780486282114'), 'borrow', '2025-01-08T11:00:00Z', '2025-01-22T11:00:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.books WHERE isbn = '9780486282114'), 'return', '2025-01-21T16:45:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM public.books WHERE isbn = '9780062315007'), 'borrow', '2025-01-15T13:20:00Z', '2025-01-29T13:20:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM public.books WHERE isbn = '9780062315007'), 'return', '2025-01-27T10:15:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM public.books WHERE isbn = '9780439708180'), 'borrow', '2025-01-03T14:30:00Z', '2025-01-17T14:30:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM public.books WHERE isbn = '9780439708180'), 'return', '2025-01-16T09:20:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM public.books WHERE isbn = '9780553213119'), 'borrow', '2025-01-14T16:45:00Z', '2025-01-28T16:45:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM public.books WHERE isbn = '9780553213119'), 'return', '2025-01-26T11:30:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5');

-- Create library sessions (students checking in/out of library)
INSERT INTO public.library_sessions (student_id, check_in_time, check_out_time, session_status, purpose) VALUES
-- Active sessions (currently in library)
('550e8400-e29b-41d4-a716-446655440001', '2025-01-28T14:30:00Z', NULL, 'active', 'study'),
('550e8400-e29b-41d4-a716-446655440003', '2025-01-28T15:45:00Z', NULL, 'active', 'research'),
('550e8400-e29b-41d4-a716-446655440007', '2025-01-28T16:00:00Z', NULL, 'active', 'book_return'),

-- Completed sessions (session history)
('550e8400-e29b-41d4-a716-446655440001', '2025-01-27T09:00:00Z', '2025-01-27T12:30:00Z', 'completed', 'study'),
('550e8400-e29b-41d4-a716-446655440002', '2025-01-27T10:15:00Z', '2025-01-27T15:45:00Z', 'completed', 'research'),
('550e8400-e29b-41d4-a716-446655440003', '2025-01-26T13:20:00Z', '2025-01-26T17:00:00Z', 'completed', 'study'),
('550e8400-e29b-41d4-a716-446655440004', '2025-01-26T14:30:00Z', '2025-01-26T16:15:00Z', 'completed', 'book_browsing'),
('550e8400-e29b-41d4-a716-446655440005', '2025-01-25T11:45:00Z', '2025-01-25T14:20:00Z', 'completed', 'study'),
('550e8400-e29b-41d4-a716-446655440006', '2025-01-25T15:30:00Z', '2025-01-25T18:10:00Z', 'completed', 'research'),
('550e8400-e29b-41d4-a716-446655440007', '2025-01-24T08:45:00Z', '2025-01-24T12:00:00Z', 'completed', 'study'),
('550e8400-e29b-41d4-a716-446655440008', '2025-01-24T13:15:00Z', '2025-01-24T16:30:00Z', 'completed', 'book_return');