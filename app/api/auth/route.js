import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { 
  initDb, 
  migrateJsonToSqlite, 
  runQuery, 
  getQuery, 
  allQuery 
} from '../../../lib/db';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

let dbInitialized = false;

// Ensure database tables exist and JSON data is migrated
async function ensureDb() {
  if (isSupabaseConfigured) return; // Supabase tables must be created via Supabase Console SQL Editor
  if (!dbInitialized) {
    await initDb();
    await migrateJsonToSqlite();
    dbInitialized = true;
  }
}

// Fetch complete user object formatted for frontend
async function getUserWithSavedData(identifier) {
  if (isSupabaseConfigured) {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('identifier', identifier)
      .maybeSingle();
      
    if (userErr || !user) return null;

    const { data: dbSavedPlaces } = await supabase
      .from('saved_places')
      .select('*')
      .eq('user_identifier', identifier);

    const savedPlaces = (dbSavedPlaces || []).map(p => ({
      place_name: p.place_name,
      category: p.category,
      district: p.district,
      province_or_city: p.province_or_city,
      latitude: p.latitude,
      longitude: p.longitude,
      cost_level_norm: p.cost_level_norm,
      duration_norm: p.duration_norm,
      popularity_norm: p.popularity_norm,
      hidden_gem_score_norm: p.hidden_gem_score_norm,
      savedAt: p.saved_at
    }));

    return {
      identifier: user.identifier,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      savedPlaces,
      savedPreferences: typeof user.saved_preferences === 'string' 
        ? JSON.parse(user.saved_preferences || '{}') 
        : (user.saved_preferences || {}),
      createdAt: user.created_at
    };
  }

  // SQLite Fallback
  const user = await getQuery(`SELECT * FROM users WHERE identifier = ?`, [identifier]);
  if (!user) return null;

  const dbSavedPlaces = await allQuery(`SELECT * FROM saved_places WHERE user_identifier = ?`, [identifier]);
  
  const savedPlaces = dbSavedPlaces.map(p => ({
    place_name: p.place_name,
    category: p.category,
    district: p.district,
    province_or_city: p.province_or_city,
    latitude: p.latitude,
    longitude: p.longitude,
    cost_level_norm: p.cost_level_norm,
    duration_norm: p.duration_norm,
    popularity_norm: p.popularity_norm,
    hidden_gem_score_norm: p.hidden_gem_score_norm,
    savedAt: p.saved_at
  }));

  return {
    identifier: user.identifier,
    email: user.email,
    phone: user.phone,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    savedPlaces,
    savedPreferences: JSON.parse(user.saved_preferences || '{}'),
    createdAt: user.created_at
  };
}

// Hash password with salt using PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password with compatibility fallback for existing plain text
function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;
  if (!storedPassword.includes(':')) {
    return password === storedPassword; // Compatibility fallback for old plain-text profiles
  }
  const [salt, hash] = storedPassword.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function decodeGoogleJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    await ensureDb();
    
    const body = await request.json();
    const { action, email, identifier, name, password, credential, preferences, place } = body;
    const activeId = identifier || email;

    // 1. Google OAuth Sign-In / Sign-Up
    if (action === 'google') {
      let userEmail = email;
      let userName = name;
      let avatar = body.avatar || null;

      // Handle real Google JWT Credential Token
      if (credential) {
        const decoded = decodeGoogleJWT(credential);
        if (decoded) {
          userEmail = decoded.email || userEmail;
          userName = decoded.name || userName;
          avatar = decoded.picture || avatar;
        }
      }

      userEmail = userEmail || 'user@gmail.com';
      userName = userName || 'Google User';
      avatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

      if (isSupabaseConfigured) {
        const { data: userExists } = await supabase
          .from('users')
          .select('identifier')
          .eq('identifier', userEmail)
          .maybeSingle();

        if (!userExists) {
          await supabase.from('users').insert({
            identifier: userEmail,
            email: userEmail,
            name: userName,
            avatar,
            provider: 'google',
            saved_preferences: { interests: ['food', 'nature'], budget: 'medium', time: 'any', province: 'any' },
            created_at: new Date().toISOString()
          });
        } else {
          await supabase.from('users').update({
            name: userName,
            avatar
          }).eq('identifier', userEmail);
        }
      } else {
        const userExists = await getQuery(`SELECT identifier FROM users WHERE identifier = ?`, [userEmail]);
        if (!userExists) {
          await runQuery(`
            INSERT INTO users (identifier, email, phone, name, avatar, password, provider, saved_preferences, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userEmail,
            userEmail,
            null,
            userName,
            avatar,
            null,
            'google',
            JSON.stringify({ interests: ['food', 'nature'], budget: 'medium', time: 'any', province: 'any' }),
            new Date().toISOString()
          ]);
        } else {
          await runQuery(`
            UPDATE users SET name = ?, avatar = ? WHERE identifier = ?
          `, [userName, avatar, userEmail]);
        }
      }

      const fullUser = await getUserWithSavedData(userEmail);
      return NextResponse.json({ success: true, user: fullUser });
    }

    // 2. Email / Phone Sign Up
    if (action === 'signup') {
      if (!activeId || !password) {
        return NextResponse.json({ error: 'Email or phone and password required' }, { status: 400 });
      }
      
      if (isSupabaseConfigured) {
        const { data: userExists } = await supabase
          .from('users')
          .select('identifier')
          .eq('identifier', activeId)
          .maybeSingle();

        if (userExists) {
          return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
        }

        const isEmail = activeId.includes('@');
        const userName = name || (isEmail ? activeId.split('@')[0] : `User_${activeId.slice(-4)}`);
        const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        await supabase.from('users').insert({
          identifier: activeId,
          email: isEmail ? activeId : null,
          phone: !isEmail ? activeId : null,
          name: userName,
          avatar: userAvatar,
          password: hashPassword(password),
          provider: isEmail ? 'email' : 'phone',
          saved_preferences: { interests: [], budget: 'any', time: 'any', province: 'any' },
          created_at: new Date().toISOString()
        });
      } else {
        const userExists = await getQuery(`SELECT identifier FROM users WHERE identifier = ?`, [activeId]);
        if (userExists) {
          return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
        }

        const isEmail = activeId.includes('@');
        const userName = name || (isEmail ? activeId.split('@')[0] : `User_${activeId.slice(-4)}`);
        const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        await runQuery(`
          INSERT INTO users (identifier, email, phone, name, avatar, password, provider, saved_preferences, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          activeId,
          isEmail ? activeId : null,
          !isEmail ? activeId : null,
          userName,
          userAvatar,
          hashPassword(password),
          isEmail ? 'email' : 'phone',
          JSON.stringify({ interests: [], budget: 'any', time: 'any', province: 'any' }),
          new Date().toISOString()
        ]);
      }

      const fullUser = await getUserWithSavedData(activeId);
      return NextResponse.json({ success: true, user: fullUser });
    }

    // 3. Email / Phone Sign In
    if (action === 'login') {
      if (!activeId || !password) {
        return NextResponse.json({ error: 'Email/phone and password required' }, { status: 400 });
      }
      
      let user = null;
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('users')
          .select('password')
          .eq('identifier', activeId)
          .maybeSingle();
        user = data;
      } else {
        user = await getQuery(`SELECT password FROM users WHERE identifier = ?`, [activeId]);
      }

      if (!user || !verifyPassword(password, user.password)) {
        return NextResponse.json({ error: 'Invalid email/phone or password' }, { status: 401 });
      }
      
      const fullUser = await getUserWithSavedData(activeId);
      return NextResponse.json({ success: true, user: fullUser });
    }

    // 4. Save User Preferences
    if (action === 'save_preferences') {
      if (isSupabaseConfigured) {
        const { data: userExists } = await supabase
          .from('users')
          .select('identifier')
          .eq('identifier', activeId)
          .maybeSingle();

        if (!activeId || !userExists) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await supabase
          .from('users')
          .update({ saved_preferences: preferences })
          .eq('identifier', activeId);
      } else {
        const userExists = await getQuery(`SELECT identifier FROM users WHERE identifier = ?`, [activeId]);
        if (!activeId || !userExists) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await runQuery(`UPDATE users SET saved_preferences = ? WHERE identifier = ?`, [
          JSON.stringify(preferences),
          activeId
        ]);
      }

      const fullUser = await getUserWithSavedData(activeId);
      return NextResponse.json({ success: true, user: fullUser });
    }

    // 5. Toggle Saved Place / Bookmark
    if (action === 'toggle_saved_place') {
      if (isSupabaseConfigured) {
        const { data: userExists, error: userErr } = await supabase
          .from('users')
          .select('identifier')
          .eq('identifier', activeId)
          .maybeSingle();

        if (userErr) {
          console.error("Supabase user exists query error:", userErr.message);
        }

        if (!activeId || !userExists) {
          return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
        }

        const { data: exists, error: existsErr } = await supabase
          .from('saved_places')
          .select('id')
          .eq('user_identifier', activeId)
          .eq('place_name', place.place_name)
          .maybeSingle();

        if (existsErr) {
          console.error("Supabase bookmark exists query error:", existsErr.message);
        }

        if (exists) {
          const { error: delErr } = await supabase
            .from('saved_places')
            .delete()
            .eq('user_identifier', activeId)
            .eq('place_name', place.place_name);
          
          if (delErr) {
            console.error("Supabase bookmark delete error:", delErr.message);
          }
        } else {
          const { error: insErr } = await supabase.from('saved_places').insert({
            user_identifier: activeId,
            place_name: place.place_name,
            category: place.category || null,
            district: place.district || null,
            province_or_city: place.province_or_city || null,
            latitude: place.latitude || null,
            longitude: place.longitude || null,
            cost_level_norm: place.cost_level_norm || null,
            duration_norm: place.duration_norm || null,
            popularity_norm: place.popularity_norm || null,
            hidden_gem_score_norm: place.hidden_gem_score_norm || null,
            saved_at: new Date().toISOString()
          });

          if (insErr) {
            console.error("Supabase bookmark insert error:", insErr.message);
          }
        }
      } else {
        const userExists = await getQuery(`SELECT identifier FROM users WHERE identifier = ?`, [activeId]);
        if (!activeId || !userExists) {
          return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
        }

        const exists = await getQuery(`
          SELECT id FROM saved_places WHERE user_identifier = ? AND place_name = ?
        `, [activeId, place.place_name]);

        if (exists) {
          await runQuery(`
            DELETE FROM saved_places WHERE user_identifier = ? AND place_name = ?
          `, [activeId, place.place_name]);
        } else {
          await runQuery(`
            INSERT INTO saved_places (user_identifier, place_name, category, district, province_or_city, latitude, longitude, cost_level_norm, duration_norm, popularity_norm, hidden_gem_score_norm, saved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            activeId,
            place.place_name,
            place.category || null,
            place.district || null,
            place.province_or_city || null,
            place.latitude || null,
            place.longitude || null,
            place.cost_level_norm || null,
            place.duration_norm || null,
            place.popularity_norm || null,
            place.hidden_gem_score_norm || null,
            new Date().toISOString()
          ]);
        }
      }

      const fullUser = await getUserWithSavedData(activeId);
      return NextResponse.json({ success: true, user: fullUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Auth API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
