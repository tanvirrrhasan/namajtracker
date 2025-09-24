
-- Members table for organization members
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE, -- Links to Mocha Users Service
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  is_admin BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  joined_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prayer tracking table
CREATE TABLE prayer_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  prayer_date DATE NOT NULL,
  fajr BOOLEAN DEFAULT 0,
  dhuhr BOOLEAN DEFAULT 0,
  asr BOOLEAN DEFAULT 0,
  maghrib BOOLEAN DEFAULT 0,
  isha BOOLEAN DEFAULT 0,
  updated_by_user_id TEXT NOT NULL, -- Who updated this record
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table for community activities
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  image_url TEXT,
  created_by_user_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery/Media table
CREATE TABLE gallery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  event_id INTEGER,
  uploaded_by_user_id TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community activities/services table
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL, -- 'mosque_cleaning', 'madrasa_teaching', 'community_service', etc.
  scheduled_date DATE,
  assigned_members TEXT, -- JSON array of member IDs
  status TEXT DEFAULT 'planned', -- 'planned', 'in_progress', 'completed'
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_prayer_records_member_date ON prayer_records(member_id, prayer_date);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_gallery_event ON gallery_items(event_id);
CREATE INDEX idx_activities_date ON activities(scheduled_date);
