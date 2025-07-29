-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for book covers
CREATE POLICY "Book covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-covers' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

CREATE POLICY "Admins can update book covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'book-covers' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-covers' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));