-- Add more books to the catalog
INSERT INTO public.books (isbn, title, author, publisher, publication_year, category, total_copies, available_copies, location_shelf) VALUES
('9780131103627', 'The C Programming Language', 'Brian Kernighan, Dennis Ritchie', 'Prentice Hall', 1988, 'Technology', 4, 4, 'A1-006'),
('9780596009205', 'Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', 'O''Reilly Media', 2004, 'Technology', 3, 3, 'A1-007'),
('9781449331818', 'Learning Python', 'Mark Lutz', 'O''Reilly Media', 2013, 'Technology', 5, 5, 'A1-008'),
('9780135957059', 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, 'Technology', 4, 4, 'A1-009'),
('9780735619670', 'Code Complete', 'Steve McConnell', 'Microsoft Press', 2004, 'Technology', 3, 3, 'A1-010'),
('9780553213119', 'Foundation', 'Isaac Asimov', 'Bantam Books', 1991, 'Science Fiction', 6, 6, 'C3-003'),
('9780547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Houghton Mifflin', 2012, 'Fantasy', 8, 8, 'C3-004'),
('9780439023481', 'The Hunger Games', 'Suzanne Collins', 'Scholastic', 2008, 'Fiction', 7, 7, 'C3-005'),
('9780452284234', 'Brave New World', 'Aldous Huxley', 'Harper Perennial', 2006, 'Science Fiction', 5, 5, 'C3-006'),
('9780062073488', 'And Then There Were None', 'Agatha Christie', 'William Morrow', 2011, 'Mystery', 4, 4, 'D4-001'),
('9780385534260', 'The Fault in Our Stars', 'John Green', 'Dutton Books', 2012, 'Young Adult', 6, 6, 'D4-002'),
('9780345391803', 'The Hitchhiker''s Guide to the Galaxy', 'Douglas Adams', 'Del Rey', 1995, 'Science Fiction', 5, 5, 'D4-003'),
('9780140449136', 'Crime and Punishment', 'Fyodor Dostoevsky', 'Penguin Classics', 2003, 'Literature', 3, 3, 'B2-004'),
('9780451524935', '1984', 'George Orwell', 'Signet Classics', 1950, 'Literature', 5, 5, 'B2-005'),
('9780307588364', 'Gone Girl', 'Gillian Flynn', 'Crown Publishers', 2012, 'Thriller', 4, 4, 'D4-004'),
('9780525478812', 'The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Atria Books', 2017, 'Fiction', 6, 6, 'C3-006'),
('9780143127550', 'Becoming', 'Michelle Obama', 'Crown Publishing', 2018, 'Biography', 4, 4, 'E5-001'),
('9780544003415', 'The Lord of the Rings', 'J.R.R. Tolkien', 'Houghton Mifflin', 2012, 'Fantasy', 5, 5, 'C3-007'),
('9780385537859', 'A Game of Thrones', 'George R.R. Martin', 'Bantam Books', 2011, 'Fantasy', 3, 3, 'C3-008'),
('9780316769174', 'The Catcher in the Rye', 'J.D. Salinger', 'Little, Brown', 1991, 'Literature', 4, 4, 'B2-006');

-- Create sample book transactions for your existing account to demonstrate functionality
-- Get current user ID for transactions
INSERT INTO public.book_transactions (student_id, book_id, transaction_type, transaction_date, due_date, status, processed_by) VALUES
-- Sample active borrowing for your account
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780132350884'), 'borrow', '2025-01-25T10:00:00Z', '2025-02-08T10:00:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780131103627'), 'borrow', '2025-01-26T14:30:00Z', '2025-02-09T14:30:00Z', 'active', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),

-- Sample transaction history
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780141439518'), 'borrow', '2025-01-15T09:00:00Z', '2025-01-29T09:00:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780141439518'), 'return', '2025-01-28T16:30:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780486282114'), 'borrow', '2025-01-10T11:00:00Z', '2025-01-24T11:00:00Z', 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', (SELECT id FROM public.books WHERE isbn = '9780486282114'), 'return', '2025-01-23T15:45:00Z', NULL, 'returned', '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5');

-- Create library sessions for your account
INSERT INTO public.library_sessions (student_id, check_in_time, check_out_time, session_status, purpose) VALUES
-- Active session (currently in library)
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', '2025-01-28T15:30:00Z', NULL, 'active', 'study'),

-- Session history
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', '2025-01-27T09:00:00Z', '2025-01-27T13:30:00Z', 'completed', 'research'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', '2025-01-26T14:15:00Z', '2025-01-26T18:00:00Z', 'completed', 'study'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', '2025-01-25T10:30:00Z', '2025-01-25T12:45:00Z', 'completed', 'book_browsing'),
('6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5', '2025-01-24T16:00:00Z', '2025-01-24T19:30:00Z', 'completed', 'study');