import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROFILES_FILE = path.join(process.cwd(), 'Data', 'user_profiles.json');

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
    }
  } catch (err) {}
  return {};
}

function saveProfiles(profiles) {
  try {
    const dir = path.dirname(PROFILES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err) {}
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const accessToken = searchParams.get('access_token');

  // If token is in hash or params, fetch user info from Google's real API
  if (accessToken) {
    try {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const googleUser = await googleRes.json();

      if (googleUser.email) {
        const profiles = loadProfiles();
        const userEmail = googleUser.email;
        const userName = googleUser.name || googleUser.email.split('@')[0];
        const avatar = googleUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        profiles[userEmail] = {
          email: userEmail,
          name: userName,
          avatar: avatar,
          provider: 'google',
          savedPlaces: profiles[userEmail]?.savedPlaces || [],
          savedPreferences: profiles[userEmail]?.savedPreferences || { interests: ['food', 'nature'], budget: 'medium' },
          createdAt: profiles[userEmail]?.createdAt || new Date().toISOString(),
        };
        saveProfiles(profiles);

        // Redirect back to home page with user logged in
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.set('inzira_session', userEmail, { path: '/' });
        return response;
      }
    } catch (e) {
      console.error('Failed to fetch Google userinfo:', e);
    }
  }

  return NextResponse.redirect(new URL('/', request.url));
}
