-- Update user role to admin for hrishikeshgade01@gmail.com
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'hrishikeshgade01@gmail.com'
);