-- Give admin access to vaitanvir833@gmail.com
-- This will update the member with email vaitanvir833@gmail.com to have admin privileges

UPDATE members 
SET is_admin = 1, updated_at = CURRENT_TIMESTAMP 
WHERE email = 'vaitanvir833@gmail.com';

-- If the member doesn't exist yet, we'll create a placeholder entry
-- (This will be updated when the user actually signs up through the system)
INSERT OR IGNORE INTO members (
  user_id, 
  name, 
  email, 
  is_admin, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  'temp_user_id_vaitanvir833', 
  'Admin User', 
  'vaitanvir833@gmail.com', 
  1, 
  1, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
