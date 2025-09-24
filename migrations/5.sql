
-- Add a test admin member for demonstration
-- First we'll update the first member to be an admin if they exist
UPDATE members SET is_admin = 1 WHERE id = 1;

-- If no members exist yet, we'll just prepare the structure for when someone signs up
