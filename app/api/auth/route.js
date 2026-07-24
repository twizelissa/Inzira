import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROFILES_FILE = path.join(process.cwd(), 'Data', 'user_profiles.json');

// Ensure profiles file exists
function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading profiles:', err);
  }
  return {};
}

function saveProfiles(profiles) {
  try {
    const dir = path.dirname(PROFILES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing profiles:', err);
  }
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
    const body = await request.json();
    const { action, email, identifier, name, password, credential, preferences, place } = body;
    const profiles = loadProfiles();
    const activeId = identifier || email;

    // 1. Google OAuth Sign-In / Sign-Up
    if (action === 'google') {
      let userEmail = email;
      let userName = name;
      let avatar = body.avatar || null;

      // Handle real Google JWT Credential Token from Google Identity Services
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

      if (!profiles[userEmail]) {
        profiles[userEmail] = {
          email: userEmail,
          name: userName,
          avatar: avatar,
          provider: 'google',
          savedPlaces: [],
          savedPreferences: { interests: ['food', 'nature'], budget: 'medium', time: 'any', province: 'any' },
          createdAt: new Date().toISOString(),
        };
      } else {
        profiles[userEmail].name = userName;
        if (avatar) profiles[userEmail].avatar = avatar;
      }

      saveProfiles(profiles);
      return NextResponse.json({ success: true, user: profiles[userEmail] });
    }

    // 2. Email / Phone Sign Up
    if (action === 'signup') {
      if (!activeId || !password) {
        return NextResponse.json({ error: 'Email or phone and password required' }, { status: 400 });
      }
      if (profiles[activeId]) {
        return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
      }

      const isEmail = activeId.includes('@');
      const userName = name || (isEmail ? activeId.split('@')[0] : `User_${activeId.slice(-4)}`);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

      profiles[activeId] = {
        identifier: activeId,
        email: isEmail ? activeId : null,
        phone: !isEmail ? activeId : null,
        name: userName,
        avatar,
        password, // In production, hash with bcrypt
        provider: isEmail ? 'email' : 'phone',
        savedPlaces: [],
        savedPreferences: { interests: [], budget: 'any', time: 'any', province: 'any' },
        createdAt: new Date().toISOString(),
      };

      saveProfiles(profiles);
      return NextResponse.json({ success: true, user: profiles[activeId] });
    }

    // 3. Email / Phone Sign In
    if (action === 'login') {
      if (!activeId || !password) {
        return NextResponse.json({ error: 'Email/phone and password required' }, { status: 400 });
      }
      const user = profiles[activeId];
      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid email/phone or password' }, { status: 401 });
      }
      return NextResponse.json({ success: true, user });
    }

    // 4. Save User Preferences
    if (action === 'save_preferences') {
      if (!activeId || !profiles[activeId]) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      profiles[activeId].savedPreferences = preferences;
      saveProfiles(profiles);
      return NextResponse.json({ success: true, user: profiles[activeId] });
    }

    // 5. Toggle Saved Place / Bookmark
    if (action === 'toggle_saved_place') {
      if (!activeId || !profiles[activeId]) {
        return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
      }
      const saved = profiles[activeId].savedPlaces || [];
      const existsIdx = saved.findIndex(p => p.place_name === place.place_name);

      if (existsIdx >= 0) {
        saved.splice(existsIdx, 1); // Remove
      } else {
        saved.push({ ...place, savedAt: new Date().toISOString() }); // Add
      }

      profiles[activeId].savedPlaces = saved;
      saveProfiles(profiles);
      return NextResponse.json({ success: true, user: profiles[activeId] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Auth API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
