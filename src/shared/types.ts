import z from "zod";

// Member schemas
export const MemberSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  is_admin: z.boolean(),
  is_active: z.boolean(),
  joined_date: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Member = z.infer<typeof MemberSchema>;

// Prayer record schemas
export const PrayerRecordSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  prayer_date: z.string(),
  fajr: z.boolean(),
  dhuhr: z.boolean(),
  asr: z.boolean(),
  maghrib: z.boolean(),
  isha: z.boolean(),
  updated_by_user_id: z.string(),
  is_self_updated: z.boolean(),
  fajr_locked: z.boolean(),
  dhuhr_locked: z.boolean(),
  asr_locked: z.boolean(),
  maghrib_locked: z.boolean(),
  isha_locked: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PrayerRecord = z.infer<typeof PrayerRecordSchema>;

// Prayer update input schema
export const PrayerUpdateSchema = z.object({
  member_id: z.number(),
  prayer_date: z.string(),
  prayer_type: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
  completed: z.boolean(),
});

export type PrayerUpdate = z.infer<typeof PrayerUpdateSchema>;

// Event schemas
export const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  event_date: z.string(),
  event_time: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().optional(),
  created_by_user_id: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Event = z.infer<typeof EventSchema>;

// Gallery item schemas
export const GalleryItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  media_url: z.string(),
  media_type: z.enum(['image', 'video']),
  event_id: z.number().optional(),
  uploaded_by_user_id: z.string(),
  is_featured: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GalleryItem = z.infer<typeof GalleryItemSchema>;

// Activity schemas
export const ActivitySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  activity_type: z.string(),
  scheduled_date: z.string().optional(),
  assigned_members: z.string().optional(), // JSON string
  status: z.enum(['planned', 'in_progress', 'completed']),
  created_by_user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
