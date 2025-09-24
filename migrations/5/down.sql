
-- Remove admin status from the first member
UPDATE members SET is_admin = 0 WHERE id = 1;
