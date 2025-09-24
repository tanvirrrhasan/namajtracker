
-- Add individual prayer lock columns
ALTER TABLE prayer_records ADD COLUMN fajr_locked BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN dhuhr_locked BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN asr_locked BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN maghrib_locked BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN isha_locked BOOLEAN DEFAULT 0;

-- Update existing records where is_self_updated = 1 to lock all prayers
UPDATE prayer_records 
SET fajr_locked = 1, dhuhr_locked = 1, asr_locked = 1, maghrib_locked = 1, isha_locked = 1 
WHERE is_self_updated = 1;
