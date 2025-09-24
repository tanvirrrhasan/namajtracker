
-- Add columns to track if each prayer has been individually updated
ALTER TABLE prayer_records ADD COLUMN fajr_updated BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN dhuhr_updated BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN asr_updated BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN maghrib_updated BOOLEAN DEFAULT 0;
ALTER TABLE prayer_records ADD COLUMN isha_updated BOOLEAN DEFAULT 0;
