-- Remove admin access from vaitanvir833@gmail.com
UPDATE members 
SET is_admin = 0, updated_at = CURRENT_TIMESTAMP 
WHERE email = 'vaitanvir833@gmail.com';

-- Remove the temporary user entry if it exists
DELETE FROM members 
WHERE email = 'vaitanvir833@gmail.com' AND user_id = 'temp_user_id_vaitanvir833';
