-- Update the new user account to admin role
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '6fa715ef-c6ee-45c0-bab7-c270c4cfc1e5';