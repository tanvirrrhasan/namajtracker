
-- Remove individual prayer lock columns
ALTER TABLE prayer_records DROP COLUMN isha_locked;
ALTER TABLE prayer_records DROP COLUMN maghrib_locked;
ALTER TABLE prayer_records DROP COLUMN asr_locked;
ALTER TABLE prayer_records DROP COLUMN dhuhr_locked;
ALTER TABLE prayer_records DROP COLUMN fajr_locked;
