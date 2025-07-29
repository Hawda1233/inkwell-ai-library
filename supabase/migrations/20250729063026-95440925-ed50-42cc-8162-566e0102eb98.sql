-- Create digital IDs for existing students who don't have them
DO $$
DECLARE
    student_record RECORD;
    student_num TEXT;
    qr_data TEXT;
BEGIN
    -- Loop through all students who don't have digital IDs
    FOR student_record IN 
        SELECT p.id, p.email, p.full_name 
        FROM profiles p
        JOIN user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'student' 
        AND p.id NOT IN (SELECT student_id FROM student_digital_ids)
    LOOP
        -- Generate unique student number (format: YEAR + random 6 digits)
        student_num := EXTRACT(YEAR FROM NOW())::TEXT || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM student_digital_ids WHERE student_number = student_num) LOOP
            student_num := EXTRACT(YEAR FROM NOW())::TEXT || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        END LOOP;
        
        -- Create QR code data (JSON format with student info)
        qr_data := json_build_object(
            'student_id', student_record.id,
            'student_number', student_num,
            'email', student_record.email,
            'full_name', student_record.full_name,
            'issued_at', NOW()
        )::TEXT;
        
        -- Insert digital ID record
        INSERT INTO student_digital_ids (student_id, qr_code_data, student_number)
        VALUES (student_record.id, qr_data, student_num);
        
        RAISE NOTICE 'Created digital ID for student: % (%)', student_record.full_name, student_num;
    END LOOP;
END $$;