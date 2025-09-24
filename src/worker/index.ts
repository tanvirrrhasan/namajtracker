import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { zValidator } from "@hono/zod-validator";
import { PrayerUpdateSchema } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Authentication routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Member management routes
app.get("/api/members", authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM members WHERE is_active = 1 ORDER BY name"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch members" }, 500);
  }
});

app.get("/api/members/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }
  
  try {
    const member = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!member) {
      // Check if this is the first member (auto-make admin)
      const { results: existingMembers } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM members"
      ).all();
      
      const isFirstMember = existingMembers[0]?.count === 0;
      
      // Create member profile if doesn't exist
      const result = await c.env.DB.prepare(
        "INSERT INTO members (user_id, name, email, joined_date, is_admin) VALUES (?, ?, ?, DATE('now'), ?)"
      ).bind(user.id, user.google_user_data.name || user.email, user.email, isFirstMember ? 1 : 0).run();

      const newMember = await c.env.DB.prepare(
        "SELECT * FROM members WHERE id = ?"
      ).bind(result.meta.last_row_id).first();

      return c.json({ success: true, data: newMember });
    }

    return c.json({ success: true, data: member });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch profile" }, 500);
  }
});

// Prayer tracking routes
app.get("/api/prayers/today", authMiddleware, async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        pr.*,
        m.name as member_name
      FROM prayer_records pr
      JOIN members m ON pr.member_id = m.id
      WHERE pr.prayer_date = ? AND m.is_active = 1
      ORDER BY m.name
    `).bind(today).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch prayer records" }, 500);
  }
});

app.post("/api/prayers/update", authMiddleware, zValidator('json', PrayerUpdateSchema), async (c) => {
  const user = c.get("user");
  const { member_id, prayer_date, prayer_type, completed } = c.req.valid('json');

  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is updating their own record or if they're admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember) {
      return c.json({ success: false, error: "Member not found" }, 404);
    }

    const targetMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE id = ?"
    ).bind(member_id).first();

    if (!targetMember) {
      return c.json({ success: false, error: "Target member not found" }, 404);
    }

    const isSelfUpdate = currentMember.id === member_id;

    // Check if record exists for this date
    let prayerRecord = await c.env.DB.prepare(
      "SELECT * FROM prayer_records WHERE member_id = ? AND prayer_date = ?"
    ).bind(member_id, prayer_date).first();

    if (!prayerRecord) {
      // Create new record with all prayers initially null/unupdated
      const isSelf = isSelfUpdate ? 1 : 0;
      await c.env.DB.prepare(
        "INSERT INTO prayer_records (member_id, prayer_date, fajr, dhuhr, asr, maghrib, isha, updated_by_user_id, is_self_updated, fajr_locked, dhuhr_locked, asr_locked, maghrib_locked, isha_locked, fajr_updated, dhuhr_updated, asr_updated, maghrib_updated, isha_updated) VALUES (?, ?, 0, 0, 0, 0, 0, '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)"
      ).bind(member_id, prayer_date).run();

      prayerRecord = await c.env.DB.prepare(
        "SELECT * FROM prayer_records WHERE member_id = ? AND prayer_date = ?"
      ).bind(member_id, prayer_date).first();
    }

    if (!prayerRecord) {
      return c.json({ success: false, error: "Failed to create prayer record" }, 500);
    }

    // Check if this specific prayer is already locked by the member
    const lockColumn = `${prayer_type}_locked`;
    if (prayerRecord[lockColumn] && !isSelfUpdate) {
      return c.json({ success: false, error: "Prayer already locked by member" }, 403);
    }

    // Update the specific prayer and lock it if self-updated
    const lockValue = isSelfUpdate ? 1 : prayerRecord[lockColumn];
    const updatedColumn = `${prayer_type}_updated`;
    await c.env.DB.prepare(
      `UPDATE prayer_records SET ${prayer_type} = ?, ${lockColumn} = ?, ${updatedColumn} = 1, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(completed ? 1 : 0, lockValue, user.id, prayerRecord.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: "Failed to update prayer" }, 500);
  }
});

// Events routes
app.get("/api/events", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM events WHERE is_active = 1 ORDER BY event_date DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch events" }, 500);
  }
});

// Activities routes
app.get("/api/activities", authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM activities ORDER BY scheduled_date DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch activities" }, 500);
  }
});

// Gallery routes
app.get("/api/gallery", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM gallery_items ORDER BY created_at DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch gallery" }, 500);
  }
});

// Admin routes (requires authentication and admin privileges)
app.get("/api/admin/members", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember || !currentMember.is_admin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM members ORDER BY created_at DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch members" }, 500);
  }
});

app.get("/api/admin/events", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember || !currentMember.is_admin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM events ORDER BY created_at DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch events" }, 500);
  }
});

app.get("/api/admin/activities", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember || !currentMember.is_admin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM activities ORDER BY created_at DESC"
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: "Failed to fetch activities" }, 500);
  }
});

app.post("/api/admin/members/toggle-admin", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember || !currentMember.is_admin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { member_id, is_admin } = body;

    await c.env.DB.prepare(
      "UPDATE members SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(is_admin ? 1 : 0, member_id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: "Failed to update admin status" }, 500);
  }
});

app.post("/api/admin/members/toggle-active", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  try {
    // Check if user is admin
    const currentMember = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ?"
    ).bind(user.id).first();

    if (!currentMember || !currentMember.is_admin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { member_id, is_active } = body;

    await c.env.DB.prepare(
      "UPDATE members SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(is_active ? 1 : 0, member_id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: "Failed to update active status" }, 500);
  }
});

export default app;
