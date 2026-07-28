'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCategoryColor,
  recommendMainPlaces,
  recommendNearbyPlaces,
} from '@/lib/recommender';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from '@/lib/firebase';

/* ──────────────────────────────────────────────────
   SVG Icons for Premium Minimalist Design
   ────────────────────────────────────────────────── */
function SvgIcon({ name, size = 18, color = 'currentColor', fill = false, style = {} }) {
  const icons = {
    nature: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z"/>
        <path d="M9 22v-2"/>
      </svg>
    ),
    wildlife: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M12 5c-.67 0-1.2.32-1.6.8L9.2 7.5a1.5 1.5 0 0 0 2.3 2.1l1.5-1.5c.32-.4.4-.93.4-1.4 0-1.1-.9-1.7-1.4-1.7Z" />
        <path d="M18 10c-.67 0-1.2.32-1.6.8l-1.2 1.7a1.5 1.5 0 0 0 2.3 2.1l1.5-1.5c.32-.4.4-.93.4-1.4 0-1.1-.9-1.7-1.4-1.7Z" />
        <path d="M6 10c-.67 0-1.2.32-1.6.8l-1.2 1.7a1.5 1.5 0 0 0 2.3 2.1l1.5-1.5c.32-.4.4-.93.4-1.4 0-1.1-.9-1.7-1.4-1.7Z" />
        <path d="M12 14c-2.8 0-5 2.2-5 5v1h10v-1c0-2.8-2.2-5-5-5Z" />
      </svg>
    ),
    culture: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M4 22h16"/>
        <path d="M20 22V5l-8-3-8 3v17"/>
        <path d="M12 22V10"/>
        <path d="M8 22V12"/>
        <path d="M16 22V12"/>
      </svg>
    ),
    food: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M12 2v20"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    history: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M12 8v4l3 3"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
    adventure: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    art: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19"/>
        <circle cx="7.5" cy="10.5" r="1" fill={color}/>
        <circle cx="11.5" cy="7.5" r="1" fill={color}/>
        <circle cx="16.5" cy="9.5" r="1" fill={color}/>
        <circle cx="15.5" cy="14.5" r="1" fill={color}/>
        <path d="M12 20h.01"/>
      </svg>
    ),
    shopping: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    relaxation: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    map: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    about: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    lodging: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M3 17h18M3 22h18M4 17v-6a8 8 0 0 1 16 0v6M12 2v3"/>
      </svg>
    ),
    waves: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M2 6c.6.5 1.2 1 2.5 1s2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1 1.2 1 2.5 1 2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1 1.2 1 2.5 1 2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1s2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1 1.2 1 2.5 1 2.5-.5 3-1 1.2-1 2.5-1 2.5.5 3 1"/>
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    chevron: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
    "arrow-left": (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={fill ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  };
  return icons[name] || (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

const INTERESTS = [
  { tag: 'food',       label: 'Food & Dining', icon: 'food' },
  { tag: 'relaxation', label: 'Cafés & Bistros', icon: 'relaxation' },
  { tag: 'nature',     label: 'Nature Spots', icon: 'nature' },
  { tag: 'wildlife',   label: 'Wildlife Safari', icon: 'wildlife' },
  { tag: 'culture',    label: 'Cultural Sites', icon: 'culture' },
  { tag: 'history',    label: 'Heritage & History', icon: 'history' },
  { tag: 'adventure',  label: 'Adventure Parks', icon: 'adventure' },
  { tag: 'shopping',   label: 'Local Markets', icon: 'shopping' },
  { tag: 'art',        label: 'Art Galleries', icon: 'art' },
];

function categoryIconName(cat) {
  const m = {
    "Nature & Wildlife":   "nature",
    "Lakes & Waterways":   "waves",
    "Cultural & Historic": "culture",
    "Attraction":          "target",
    "Scenic Viewpoints":   "adventure",
    "Food & Drink":        "food",
    "Café":                "relaxation",
    "Cafe":                "relaxation",
    "Lodging":             "lodging",
    "Markets & Shopping":  "shopping",
    "Arts & Entertainment":"art"
  };
  return m[cat] || "map";
}

const BUDGETS  = [
  { v: 'any', l: 'Any Budget' },
  { v: 'low', l: 'Budget Friendly' },
  { v: 'medium', l: 'Moderate Price' },
  { v: 'high', l: 'Fine Dining / Splurge' }
];

const TIMES    = [
  { v: 'any', l: 'Any Duration' },
  { v: '1-2 hours', l: 'Short (1–2 hrs)' },
  { v: 'half-day', l: 'Half Day (3–5 hrs)' },
  { v: 'full-day', l: 'Full Day' },
  { v: 'weekend', l: 'Weekend Trip' }
];

const HG_PREFS = [
  { v: 'hidden gems', l: 'Hidden Gems (Omit Famous Spots)' },
  { v: 'both', l: 'All Spots' },
  { v: 'popular places', l: 'Popular Favorites Only' }
];

/* ──────────────────────────────────────────────────
   Category Color Palette (Premium Flat Light Theme)
   ────────────────────────────────────────────────── */
function categoryColors(cat) {
  const c = getCategoryColor(cat);
  const palette = {
    teal:   { bg: '#EBFDF7', accent: '#1D9E75', text: '#0F6E56' },
    amber:  { bg: '#FFF9EB', accent: '#D4A843', text: '#8C6512' },
    purple: { bg: '#F6F3FF', accent: '#8b7fd4', text: '#5145A0' },
  };
  return palette[c] || palette.teal;
}

/* ──────────────────────────────────────────────────
   Place Cover Image Resolver
   ────────────────────────────────────────────────── */
function getPlaceImage(place) {
  if (!place) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80';
  if (place.image) return place.image;

  const name = (place.place_name || '').toLowerCase();
  const cat = (place.category || '').toLowerCase();

  if (name.includes('sole luna') || name.includes('pizza') || name.includes('delizia') || name.includes('italiana')) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('choma') || name.includes('grill') || name.includes('meze fresh') || name.includes('zen') || name.includes('asian') || name.includes('soy')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('bistro') || name.includes('patissier') || name.includes('baso')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('inzora') || name.includes('coffee') || name.includes('question coffee') || name.includes('café') || name.includes('cafe')) {
    return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('ethnographic') || name.includes('museum') || name.includes('king') || name.includes('palace')) {
    return 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('volcano') || name.includes('gorilla') || name.includes('national park') || name.includes('akagera')) {
    return 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=80';
  }
  if (name.includes('lake') || name.includes('kivu') || name.includes('beach') || name.includes('resort')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80';
  }

  if (cat.includes('food') || cat.includes('drink') || cat.includes('restaurant')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('café') || cat.includes('cafe')) {
    return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('nature') || cat.includes('wildlife') || cat.includes('scenic')) {
    return 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('cultural') || cat.includes('historic') || cat.includes('art')) {
    return 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('market') || cat.includes('shopping')) {
    return 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('lake') || cat.includes('water')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80';
  }
  if (cat.includes('attraction') || cat.includes('lodging')) {
    return 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=700&q=80';
  }

  // Generic Rwanda landscape fallback
  return 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=700&q=80';
}

// Mapped YouTube videos for previewing tourist spots
const SPOT_VIDEOS = {
  "King's Palace Museum": { id: "p-W4sX6W9yA", aspect: "widescreen" },
  "Kandt House Museum of Natural History": { id: "2iXU5Qh1018", aspect: "widescreen" },
  "Mvenpick Kigali": { id: "Bkhe2ed8F0s", aspect: "widescreen" },
  "Moriah Hill Hotel": { id: "6H3z4sYgL20", aspect: "widescreen" },
  "Serena Hotel": { id: "rqtv44qSt2I", aspect: "portrait" },
  "Marriott": { id: "hCsQSW1q6dk", aspect: "portrait" },
  "Kozo Restaurant": { id: "zyjLG7LdOV0", aspect: "portrait" },
  "Ruzizi Tented Lodge": { id: "29D8vXw2y3o", aspect: "widescreen" },
};

/* ──────────────────────────────────────────────────
   Main Application Page Component
   ────────────────────────────────────────────────── */
export default function Home() {
  const [places, setPlaces]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [provinces, setProvinces]   = useState([]);

  // Preferences
  const [interests, setInterests]   = useState([]);
  const [budget, setBudget]         = useState('any');
  const [time, setTime]             = useState('any');
  const [province, setProvince]     = useState('any');
  const [hgPref, setHgPref]         = useState('hidden gems');
  const [userType, setUserType]     = useState('tourist'); // 'tourist' | 'resident'
  const [topN, setTopN]             = useState(6);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  // Results State
  const [stage, setStage]           = useState('results');
  const [mainResults, setMainResults]   = useState([]);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [selPlace, setSelPlace]     = useState(null);
  const [mlStatus, setMlStatus]     = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Layout navigation
  const [activeNav, setActiveNav]   = useState('discover');
  
  // Feedback System
  const [fbRating, setFbRating]     = useState(0);
  const [fbDone, setFbDone]         = useState(false);
  const [fbComment, setFbComment]   = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  // Authentication & Saved Places System
  const [user, setUser]             = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [authError, setAuthError]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authMode, setAuthMode]             = useState('login'); // 'login' or 'signup'
  const [authIdentifier, setAuthIdentifier] = useState('');      // email or phone number
  const [authPass, setAuthPass]             = useState('');
  const [authName, setAuthName]             = useState('');

  // Load saved session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('inzira_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Load saved preferences if available
        if (parsed.savedPreferences) {
          if (parsed.savedPreferences.interests?.length) setInterests(parsed.savedPreferences.interests);
          if (parsed.savedPreferences.budget) setBudget(parsed.savedPreferences.budget);
          if (parsed.savedPreferences.province) setProvince(parsed.savedPreferences.province);
        }
      }
    } catch (e) {
      console.error('Session load error:', e);
    }
  }, []);

  // Fetch verified places from Next.js public directory
  useEffect(() => {
    fetch('/rwanda_places.json')
      .then(r => r.json())
      .then(data => {
        setPlaces(data);
        const p = [...new Set(data.map(d => d.province_or_city).filter(Boolean))].sort();
        setProvinces(p);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading place database:", err);
        setLoading(false);
      });
    // Check ML model health
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: [], budget: 'any', available_time: 'any', preferred_province: 'any', hidden_gem_pref: 'hidden gems', top_n: 1 }),
    })
      .then(r => r.json())
      .then(data => setMlStatus(data.model || 'connected'))
      .catch(() => setMlStatus('offline'));
  }, []);

  // Handle Real Google Identity Services (GIS) Credential Response
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          credential: response.credential,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('inzira_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        if (data.user.savedPreferences) {
          if (data.user.savedPreferences.interests?.length) setInterests(data.user.savedPreferences.interests);
          if (data.user.savedPreferences.budget) setBudget(data.user.savedPreferences.budget);
        }
      }
    } catch (err) {
      setAuthError('Google sign in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
    const initGsi = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (window.google?.accounts?.id && clientId && !clientId.includes('v615h8362629')) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });
        } catch (e) {
          console.log('Google Identity SDK init error:', e);
        }
      }
    };

    const existingScript = document.getElementById('gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, []);

  // Render Official Native Google Sign-In Button inside modal when opened
  useEffect(() => {
    if (showAuthModal && window.google?.accounts?.id) {
      setTimeout(() => {
        const btnContainer = document.getElementById('google-btn-native');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          try {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          } catch (e) {
            console.log('Native Google button rendered');
          }
        }
      }, 150);
    }
  }, [showAuthModal]);

  // Call ML API for recommendations when preferences change
  useEffect(() => {
    if (places.length === 0) return;
    if (selPlace) return; // Don't re-fetch main when viewing detail

    const runLocalFallback = (isError = false) => {
      if (isError) {
        setMlStatus('offline');
      }
      const userPrefs = {
        interests,
        budget,
        available_time: time,
        preferred_province: province,
        hidden_gem_pref: hgPref,
        user_type: userType,
      };
      
      let filteredPlaces = places;
      if (searchQuery.trim()) {
        const keywords = searchQuery.toLowerCase().trim().split(/\s+/);
        filteredPlaces = places.filter(p => {
          return keywords.every(kw => {
            return (
              (p.place_name || '').toLowerCase().includes(kw) ||
              (p.category || '').toLowerCase().includes(kw) ||
              (p.district || '').toLowerCase().includes(kw) ||
              (p.province_or_city || '').toLowerCase().includes(kw) ||
              (p.interest_tags || '').toLowerCase().includes(kw)
            );
          });
        });
      }

      const localResults = recommendMainPlaces(userPrefs, filteredPlaces, topN, user?.savedPlaces || []);
      const seen = new Set();
      const deduped = localResults.filter(p => {
        if (seen.has(p.place_name)) return false;
        seen.add(p.place_name);
        return true;
      }).map(p => {
        let score = p.final_score;
        let pct = p.match_pct;
        if (searchQuery.trim()) {
          const qWords = searchQuery.toLowerCase().trim().split(/\s+/);
          const nameLower = (p.place_name || '').toLowerCase();
          if (qWords.every(w => nameLower.includes(w))) {
            pct = Math.max(pct, 95);
            score = pct;
          } else if (qWords.some(w => nameLower.includes(w))) {
            pct = Math.max(pct, 85);
            score = pct;
          }
        }
        return {
          ...p,
          final_score: score,
          match_pct: pct,
        };
      });
      setMainResults(deduped);
      setStage(deduped.length > 0 ? 'results' : 'empty');
    };

    const timer = setTimeout(async () => {
      setPredicting(true);
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interests,
            budget,
            available_time: time,
            preferred_province: province,
            hidden_gem_pref: hgPref,
            top_n: topN,
            search_query: searchQuery,
            saved_places: user?.savedPlaces || [],
            user_type: userType,
          }),
        });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          // Deduplicate by place_name to prevent the same place appearing twice
          const seen = new Set();
          const deduped = data.results.filter(p => {
            if (seen.has(p.place_name)) return false;
            seen.add(p.place_name);
            return true;
          });
          setMainResults(deduped);
          setStage(deduped.length > 0 ? 'results' : 'empty');
          setMlStatus(data.model || 'connected');
        } else {
          runLocalFallback(false);
          setMlStatus(data.model || 'connected');
        }
      } catch (err) {
        console.warn('ML API request failed, using local fallback:', err);
        runLocalFallback(true);
      } finally {
        setPredicting(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [places, interests, budget, time, province, hgPref, topN, searchQuery, selPlace, user, userType]);

  // Click card to enter detailed view & load nearby spots (Stage 2) via ML API
  const handleCardClick = useCallback(async (place) => {
    setSelPlace(place);
    setStage('nearby');
    setFbRating(0);
    setFbDone(false);
    setFbComment('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let success = false;
    try {
      const res = await fetch('/api/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_name: place.place_name,
          interests,
          budget,
          available_time: time,
          hidden_gem_pref: hgPref,
          top_n: topN,
          user_type: userType,
        }),
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setNearbyResults(data.results);
        success = true;
      }
    } catch (err) {
      console.error('Nearby API error:', err);
    }

    if (!success) {
      console.warn('Running local fallback recommender');
      const userPrefs = {
        interests,
        budget,
        available_time: time,
        preferred_province: province,
        hidden_gem_pref: hgPref,
        user_type: userType,
      };
      const localNearby = recommendNearbyPlaces(place, userPrefs, places, topN);
      setNearbyResults(localNearby);
    }
  }, [interests, budget, time, province, hgPref, topN, places, userType]);

  // Authentication handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          identifier: authIdentifier,
          password: authPass,
          name: authName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Authentication failed');
      } else {
        setUser(data.user);
        localStorage.setItem('inzira_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        setAuthIdentifier('');
        setAuthPass('');
        setAuthName('');
      }
    } catch (err) {
      setAuthError('Network error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      // Direct Firebase Google Authentication Popup for project inzira-elissa
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const userEmail = result.user.email;
        const userName = result.user.displayName || userEmail.split('@')[0];
        const avatar = result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'google',
            email: userEmail,
            name: userName,
            avatar: avatar,
          }),
        });
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('inzira_user', JSON.stringify(data.user));
          setShowAuthModal(false);
          if (data.user.savedPreferences) {
            if (data.user.savedPreferences.interests?.length) setInterests(data.user.savedPreferences.interests);
            if (data.user.savedPreferences.budget) setBudget(data.user.savedPreferences.budget);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Firebase Google Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign in popup was closed. Please try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled in Firebase Console. Please enable Google under Authentication -> Sign-in method.');
      } else if (err.message) {
        setAuthError(`Firebase Auth: ${err.message}`);
      } else {
        setAuthError('Google sign in failed.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('inzira_user');
  };

  const toggleBookmark = async (place, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const originalUser = { ...user };
    const saved = user.savedPlaces || [];
    const existsIdx = saved.findIndex(p => p.place_name === place.place_name);
    let newSaved = [...saved];

    if (existsIdx >= 0) {
      newSaved.splice(existsIdx, 1); // Optimistically remove from UI
    } else {
      newSaved.push({ ...place, savedAt: new Date().toISOString() }); // Optimistically add to UI
    }

    const optimisticUser = {
      ...user,
      savedPlaces: newSaved
    };

    // 1. Instantly update UI and localStorage (0ms latency)
    setUser(optimisticUser);
    localStorage.setItem('inzira_user', JSON.stringify(optimisticUser));

    // 2. Perform DB write in the background
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_saved_place',
          email: user.email || user.identifier,
          place,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('inzira_user', JSON.stringify(data.user));
      } else {
        // Rollback if DB write fails
        setUser(originalUser);
        localStorage.setItem('inzira_user', JSON.stringify(originalUser));
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      // Rollback if network fails
      setUser(originalUser);
      localStorage.setItem('inzira_user', JSON.stringify(originalUser));
    }
  };

  const isBookmarked = (placeName) => {
    return user?.savedPlaces?.some(p => p.place_name === placeName);
  };

  const saveCurrentPreferences = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const currentPrefs = { interests, budget, province, hgPref };
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_preferences',
          email: user.email || user.identifier,
          preferences: currentPrefs,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('inzira_user', JSON.stringify(data.user));
        alert('Preferences saved as your default!');
      }
    } catch (err) {
      console.error('Save preferences error:', err);
    }
  };

  // Execute search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInputValue);
    setSelPlace(null);
  };

  // Toggle profile interests
  const toggleInterest = (tag) => {
    setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setSelPlace(null);
  };

  // Submit recommendation feedback
  const handleFeedbackSubmit = useCallback(async () => {
    if (!fbRating) return;
    setFbSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: fbRating,
          comment: fbComment,
          interests,
          selectedPlace: selPlace ? selPlace.place_name : '',
          budget,
          time,
          province,
          hgPref
        })
      });
      if (res.ok) {
        setFbDone(true);
      } else {
        alert('Failed to save feedback on server.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving feedback.');
    } finally {
      setFbSubmitting(false);
    }
  }, [fbRating, fbComment, interests, selPlace, budget, time, province, hgPref]);

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16,background:'#ffffff'}}>
        <div style={{width:32,height:32,border:'2px solid #f3f4f6',borderTopColor:'#1D9E75',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
        <p style={{color:'#6b7280',fontSize:13,fontWeight:500,letterSpacing:'0.02em'}}>Syncing Rwanda places index…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Global Reset Overrides */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; color: #1f2937; }
        button { border: none; background: none; font-family: inherit; font-size: inherit; font-weight: inherit; color: inherit; }
        input, select, textarea { font-family: inherit; outline: none; }
        
        /* Smooth transitions */
        a, button, select, input { transition: all 0.15s ease; }
        
        /* Animations */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Hide scrollbars but preserve scrolling */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ──────────────────────────────────────────────────
         Sleek Flat Header / Navigation
         ────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '0.5px solid #e5e7eb',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="header-nav-container" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setSelPlace(null); setStage('results'); setActiveNav('discover'); }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#1D9E75',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SvgIcon name="discover" size={14} color="#ffffff" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>Inzira</span>
          </div>

          {/* Navigation Links (Tabs) */}
          <div className="header-tabs" style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'nav-discover', k: 'discover', l: 'Discover', icon: 'discover' },
              { id: 'nav-map', k: 'map', l: 'Map', icon: 'map' },
              { id: 'nav-about', k: 'about', l: 'About', icon: 'about' },
            ].map(({ id, k, l, icon }) => (
              <button key={k} id={id} onClick={() => { setActiveNav(k); if (k !== 'discover') { setSelPlace(null); } }} style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                background: activeNav === k ? '#E1F5EE' : 'transparent',
                color: activeNav === k ? '#0F6E56' : '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}>
                <SvgIcon name={icon} size={14} color={activeNav === k ? '#0F6E56' : '#4b5563'} />
                {l}
              </button>
            ))}
          </div>

          {/* Auth/Saved Places Bar */}
          <div className="header-auth-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Saved Places Counter Button */}
            <button onClick={() => setShowSavedModal(true)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              background: '#f3f4f6',
              cursor: 'pointer',
            }}>
              <span style={{ color: '#ef4444' }}>❤️</span>
              <span>Saved ({user?.savedPlaces?.length || 0})</span>
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  id="btn-user-profile"
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px 4px 4px',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  title="Click to open Profile Settings"
                >
                  <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E1F5EE', objectFit: 'cover' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{user.name}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>⚙️</span>
                </button>
                <button onClick={handleLogout} style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'none' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button id="btn-signin" onClick={() => setShowAuthModal(true)} style={{
                padding: '7px 16px',
                borderRadius: '8px',
                background: '#1D9E75',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────
         Main Application Shell Layout
         ────────────────────────────────────────────────── */}
      <main className="main-shell" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 120px', minHeight: 'calc(100vh - 420px)' }}>
        
        {/* ═══ 1. DISCOVER TAB ══════════════════════════ */}
        {activeNav === 'discover' && (
          <div className="fade-up">
            
            {/* Stage: Detailed view of selected recommendation */}
            {selPlace ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Back button */}
                <button onClick={() => { setSelPlace(null); setStage('results'); }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#4b5563',
                  fontSize: '14px',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  cursor: 'pointer',
                }}>
                  <SvgIcon name="arrow-left" size={16} color="#4b5563" />
                  Back to picks
                </button>

                {/* Detail Columns */}
                <div className="place-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
                  
                  {/* Left Column: Place Details & Feedback */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                      <div>
                        <div style={{
                          display: 'inline-flex',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: categoryColors(selPlace.category).bg,
                          color: categoryColors(selPlace.category).text,
                          marginBottom: '12px'
                        }}>
                          {selPlace.category}
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '6px', lineHeight: 1.2 }}>
                          {selPlace.place_name}
                        </h1>
                        <p style={{ fontSize: '15px', color: '#6b7280', fontWeight: 500 }}>
                          {selPlace.district} · {selPlace.province_or_city}
                        </p>
                      </div>

                      {/* Save/Bookmark Button */}
                      <button 
                        onClick={(e) => toggleBookmark(selPlace, e)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: '1px solid ' + (isBookmarked(selPlace.place_name) ? '#10b981' : '#d1d5db'),
                          background: isBookmarked(selPlace.place_name) ? '#ecfdf5' : '#ffffff',
                          color: isBookmarked(selPlace.place_name) ? '#059669' : '#374151',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill={isBookmarked(selPlace.place_name) ? '#059669' : 'none'} 
                          stroke={isBookmarked(selPlace.place_name) ? '#059669' : '#374151'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {isBookmarked(selPlace.place_name) ? 'Saved' : 'Save Place'}
                      </button>
                    </div>

                    {/* Recommender match summary */}
                    <div style={{
                      border: '0.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px',
                      background: '#f9fafb',
                    }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
                        Recommendation Match Analysis
                      </h3>
                      
                      {/* Score Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: '#1D9E75', lineHeight: 1 }}>
                          {selPlace.match_pct}%
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px' }}>
                            Match Compatibility Score
                          </div>
                          <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#1D9E75', width: `${selPlace.match_pct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Matching profile list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'Budget Level', val: selPlace.cost_level_norm ? `${selPlace.cost_level_norm.charAt(0).toUpperCase() + selPlace.cost_level_norm.slice(1)}` : 'Unknown' },
                          { label: 'Recommended Duration', val: selPlace.duration_norm ? `${selPlace.duration_norm.charAt(0).toUpperCase() + selPlace.duration_norm.slice(1)}` : 'Flexible' },
                          { label: 'Highlight Tags', val: selPlace.tags_list?.length ? selPlace.tags_list.slice(0, 5).join(', ') : 'Rwandan local spot' }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '0.5px solid #e5e7eb', paddingBottom: '8px' }}>
                            <span style={{ color: '#6b7280', fontWeight: 500 }}>{item.label}</span>
                            <span style={{ color: '#1f2937', fontWeight: 600 }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Video Preview */}
                    {(() => {
                      const videoMeta = SPOT_VIDEOS[selPlace.place_name];
                      if (!videoMeta) return null;

                      const isPortrait = videoMeta.aspect === 'portrait';
                      const embedId = videoMeta.id;
                      
                      return (
                        <div style={{
                          border: '0.5px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '24px',
                          background: '#ffffff',
                        }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🎥</span> Tourist Spot Video Preview
                          </h3>
                          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                            Take a quick virtual tour of {selPlace.place_name} before you plan your trip.
                          </p>
                          <div style={isPortrait ? {
                            position: 'relative',
                            width: '240px',
                            height: '400px',
                            overflow: 'hidden',
                            borderRadius: '12px',
                            background: '#000',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                            margin: '0 auto',
                          } : {
                            position: 'relative',
                            paddingBottom: '56.25%', // 16:9 Aspect Ratio
                            height: 0,
                            overflow: 'hidden',
                            borderRadius: '8px',
                            background: '#000',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=1&loop=1&playlist=${embedId}&controls=0&disablekb=1&fs=0&modestbranding=1&iv_load_policy=3&rel=0`}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                border: 'none',
                              }}
                            />
                            {/* Transparent overlay to intercept clicks and prevent pausing */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              zIndex: 10,
                              background: 'transparent',
                            }} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Was this helpful? Feedback Box */}
                    <div style={{
                      border: '0.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px',
                      background: '#ffffff'
                    }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                        Help Us Improve Recommendations
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                        Rate this spot recommendation to train our machine learning scoring model.
                      </p>

                      {fbDone ? (
                        <div style={{
                          padding: '12px',
                          background: '#E1F5EE',
                          border: '0.5px solid rgba(29, 158, 117, 0.2)',
                          borderRadius: '8px',
                          color: '#0F6E56',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}>
                          Thanks for rating this spot! Your feedback is successfully synced.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n} id={`star-${n}`} onClick={() => setFbRating(n)} style={{
                                cursor: 'pointer',
                                padding: 2,
                                transform: 'scale(1.1)'
                              }}>
                                <SvgIcon name="star" size={24} color={n <= fbRating ? '#F5A623' : '#d1d5db'} fill={n <= fbRating} />
                              </button>
                            ))}
                          </div>

                          {fbRating > 0 && (
                            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <textarea
                                placeholder="Explain briefly why this spot fits your expectations, or suggest changes..."
                                value={fbComment}
                                onChange={e => setFbComment(e.target.value)}
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  padding: '12px',
                                  background: '#ffffff',
                                  border: '0.5px solid #d1d5db',
                                  borderRadius: '8px',
                                  color: '#1f2937',
                                  fontSize: '13px',
                                  resize: 'vertical',
                                }}
                              />
                              <button id="fb-submit" onClick={handleFeedbackSubmit} disabled={fbSubmitting} style={{
                                alignSelf: 'flex-start',
                                padding: '10px 24px',
                                borderRadius: '9999px',
                                background: '#1D9E75',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                              }}>
                                {fbSubmitting ? 'Saving...' : 'Submit Rating'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Mini Map & Nearby Picks (Stage 2) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Leaflet map of spot */}
                    <div style={{ border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                      <CanvasMap selectedPlace={selPlace} mainResults={[]} nearbyResults={nearbyResults} />
                    </div>

                    {/* Directions & Navigation */}
                    <div style={{
                      border: '0.5px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🧭</span> Get Directions & Route Navigation
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                        Guide yourself to {selPlace.place_name}. Use external mapping platforms for real-time GPS navigation, voice instructions, and traffic alerts.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selPlace.latitude},${selPlace.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: '#1D9E75',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'background 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0F6E56'}
                          onMouseLeave={e => e.currentTarget.style.background = '#1D9E75'}
                        >
                          Google Maps Directions
                        </a>
                        <a
                          href={`https://maps.apple.com/?daddr=${selPlace.latitude},${selPlace.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            fontSize: '13px',
                            fontWeight: 600,
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'background 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          Apple Maps
                        </a>
                      </div>
                    </div>

                    {/* Nearby picks list */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                        Nearby recommendations (Stage 2)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {nearbyResults.slice(0, 4).map((p, idx) => (
                          <div key={idx} onClick={() => handleCardClick(p)} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#ffffff',
                            border: '0.5px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              background: categoryColors(p.category).bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <SvgIcon name={categoryIconName(p.category)} size={18} color={categoryColors(p.category).accent} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.place_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                {p.distance_km?.toFixed(1)} km away · {p.match_pct}% match
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              // Main discover search/chips view
              <div>
                
                {/* 1. Hero Section */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h1 className="hero-title" style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-0.03em', color: '#111827', marginBottom: '10px' }}>
                    Find your next spot
                  </h1>
                  <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: 400, maxWidth: '560px', margin: '0 auto', lineHeight: 1.5 }}>
                    Discover personalized places, dining, and landmarks across Rwanda tailored to your preferences.
                  </p>
                </div>

                {/* 2. Search Bar */}
                <form onSubmit={handleSearchSubmit} style={{
                  maxWidth: '640px',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '0.5px solid #d1d5db',
                  borderRadius: '9999px',
                  padding: '4px 4px 4px 16px',
                }}>
                  <SvgIcon name="search" size={18} color="#9ca3af" style={{ marginRight: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search Kigali restaurants, scenic spots, cultural hubs..."
                    value={searchInputValue}
                    onChange={e => {
                      setSearchInputValue(e.target.value);
                      // Set search query directly for real-time reactivity
                      setSearchQuery(e.target.value);
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      fontSize: '14px',
                      color: '#1f2937',
                    }}
                  />
                  <button type="submit" style={{
                    background: '#1D9E75',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#167c5c'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1D9E75'}>
                    Search
                  </button>
                </form>

                {/* 3. Preference Chips Row */}
                <div style={{ maxWidth: '820px', margin: '0 auto 24px' }}>
                  <div className="no-scrollbar" style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    padding: '4px 2px',
                  }}>
                    {INTERESTS.map(({ tag, label, icon }) => {
                      const active = interests.includes(tag);
                      return (
                        <button
                          key={tag}
                          id={`int-${tag}`}
                          onClick={() => toggleInterest(tag)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            background: active ? '#E1F5EE' : '#ffffff',
                            color: active ? '#0F6E56' : '#374151',
                            border: active ? '0.5px solid transparent' : '0.5px solid #d1d5db',
                          }}
                        >
                          <SvgIcon name={icon} size={14} color={active ? '#0F6E56' : '#4b5563'} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horizontal Filter Selectors */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginBottom: '40px',
                }}>
                  {/* Visitor Type Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select value={userType} onChange={e => setUserType(e.target.value)} style={{
                      padding: '8px 28px 8px 12px',
                      borderRadius: '9999px',
                      border: '0.5px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                    }}>
                      <option value="tourist">✈️ International Tourist</option>
                      <option value="resident">🏡 Local Resident</option>
                    </select>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                      <SvgIcon name="chevron" size={8} />
                    </div>
                  </div>
                  {/* Budget Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select value={budget} onChange={e => setBudget(e.target.value)} style={{
                      padding: '8px 28px 8px 12px',
                      borderRadius: '9999px',
                      border: '0.5px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                    }}>
                      {BUDGETS.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                      <SvgIcon name="chevron" size={8} />
                    </div>
                  </div>

                  {/* Duration Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select value={time} onChange={e => setTime(e.target.value)} style={{
                      padding: '8px 28px 8px 12px',
                      borderRadius: '9999px',
                      border: '0.5px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                    }}>
                      {TIMES.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                      <SvgIcon name="chevron" size={8} />
                    </div>
                  </div>

                  {/* Region Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select value={province} onChange={e => setProvince(e.target.value)} style={{
                      padding: '8px 28px 8px 12px',
                      borderRadius: '9999px',
                      border: '0.5px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                    }}>
                      <option value="any">Any Region</option>
                      {provinces.map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                      <SvgIcon name="chevron" size={8} />
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <select value={hgPref} onChange={e => setHgPref(e.target.value)} style={{
                      padding: '8px 28px 8px 12px',
                      borderRadius: '9999px',
                      border: '0.5px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                    }}>
                      {HG_PREFS.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                      <SvgIcon name="chevron" size={8} />
                    </div>
                  </div>
                </div>

                {/* 4. Top Picks Grid (3 Columns) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '0.5px solid #e5e7eb', paddingBottom: '10px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {searchQuery ? `Search Results (${mainResults.length})` : 'Recommended Picks'}
                      {predicting && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#1D9E75', fontWeight: 500, textTransform: 'none' }}>⟳ Running model...</span>}
                    </h2>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {mlStatus === 'offline' ? '⚠️ ML API offline — using fallback' : 'Sorted by ML compatibility'}
                    </span>
                  </div>

                  {stage === 'empty' ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '56px 24px',
                      border: '0.5px solid #e5e7eb',
                      borderRadius: '12px',
                      background: '#f9fafb',
                      color: '#6b7280',
                    }}>
                      <div style={{ marginBottom: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6' }}>
                        <SvgIcon name="discover" size={20} color="#9ca3af" />
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>No matches found</h3>
                      <p style={{ fontSize: '13px', maxWidth: '320px', margin: '0 auto' }}>
                        Try adjusting your search filters or selecting different interests above.
                      </p>
                    </div>
                  ) : (
                    <div className="responsive-grid">
                      {mainResults.map((place, i) => {
                        const cs = categoryColors(place.category);
                        const coverImg = getPlaceImage(place);
                        return (
                          <div
                            key={place.place_id || i}
                            id={`card-${i}`}
                            className="card-container"
                            onClick={() => handleCardClick(place)}
                            style={{
                              background: '#ffffff',
                              border: '0.5px solid #e5e7eb',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#1D9E75';
                              setHoveredCard(place.place_id);
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              setHoveredCard(null);
                            }}
                          >
                            {/* Card Cover Image with Overlay Badges */}
                            <div style={{
                              height: '160px',
                              position: 'relative',
                              overflow: 'hidden',
                              background: '#000000',
                            }}>
                              {SPOT_VIDEOS[place.place_name] && hoveredCard === place.place_id ? (
                               <>
                                  <iframe
                                    src={`https://www.youtube.com/embed/${SPOT_VIDEOS[place.place_name].id}?autoplay=1&mute=1&loop=1&playlist=${SPOT_VIDEOS[place.place_name].id}&controls=0&disablekb=1&fs=0&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      pointerEvents: 'none',
                                      border: 'none',
                                      transform: SPOT_VIDEOS[place.place_name].aspect === 'portrait' ? 'scale(3.2)' : 'none',
                                      transformOrigin: 'center',
                                    }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 10,
                                    background: 'transparent',
                                  }} />
                                </>
                              ) : (
                                <>
                                  <img
                                    src={coverImg}
                                    alt={place.place_name}
                                    className="card-hover-image"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80';
                                    }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.4) 0%, transparent 60%)',
                                  }} />
                                </>
                              )}
                              
                              {/* Category Icon Badge */}
                              <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                background: 'rgba(255, 255, 255, 0.92)',
                                backdropFilter: 'blur(4px)',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: cs.text,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                              }}>
                                <SvgIcon name={categoryIconName(place.category)} size={14} color={cs.accent} />
                                <span>{place.category}</span>
                              </div>

                              {/* Bookmark Heart Button */}
                              <button 
                                onClick={(e) => toggleBookmark(place, e)}
                                title={isBookmarked(place.place_name) ? "Remove from saved places" : "Save to my places"}
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  backdropFilter: 'blur(4px)',
                                }}
                              >
                                {isBookmarked(place.place_name) ? '❤️' : '🤍'}
                              </button>
                            </div>

                            {/* Card details */}
                            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              
                              {/* Category Header */}
                              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: cs.text, marginBottom: '6px' }}>
                                {place.category}
                              </div>

                              {/* Title */}
                              <h3 style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#111827',
                                lineHeight: 1.3,
                                marginBottom: '4px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                height: '42px',
                              }}>
                                {place.place_name}
                              </h3>

                              {/* Location */}
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                                {place.district}{place.province_or_city ? ` · ${place.province_or_city.split(' ')[0]}` : ''}
                              </div>

                              {/* Compatibility bar */}
                              <div style={{ marginTop: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>Compatibility</span>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D9E75' }}>{place.match_pct}%</span>
                                </div>
                                <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', background: '#1D9E75', width: `${place.match_pct}%` }} />
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
            
          </div>
        )}

        {/* ═══ 2. MAP TAB ══════════════════════════════ */}
        {activeNav === 'map' && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Spatial Index Map
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Explore all verified destinations plotted spatially. Adjust preferences in the Discover tab to change recommendations.
              </p>
            </div>

            <div style={{ border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <CanvasMap selectedPlace={null} mainResults={mainResults} nearbyResults={[]} />
            </div>

            {/* Plotted markers table index */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                Currently Plotted Places ({mainResults.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}>
                {mainResults.map((p, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#ffffff',
                    border: '0.5px solid #e5e7eb',
                    borderRadius: '8px',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.place_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {p.district} · {p.category}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D9E75' }}>{p.match_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 3. ABOUT TAB ═════════════════════════════ */}
        {activeNav === 'about' && (
          <div className="fade-up" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                About Inzira
              </h1>
              <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6 }}>
                Inzira is a machine learning-based spatial discovery engine mapping tourist sites, heritage landmarks, and every key restaurant in Kigali, Rwanda.
              </p>
            </div>

            {/* Methodology details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '24px',
                border: '0.5px solid #e5e7eb',
                borderRadius: '12px',
                background: '#f9fafb'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                  Recommendation Architecture
                </h3>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginBottom: '16px' }}>
                  Inzira calculates recommendations dynamically in two independent execution phases based on TF-IDF cosine similarities on international reviewer catalogs, filtered profiles, and spatial coordinate math.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75' }} />
                      Stage 1 Formulation (Profile Discover)
                    </div>
                    <code style={{ display: 'block', padding: '10px', background: '#ffffff', borderRadius: '6px', fontSize: '11px', border: '0.5px solid #e5e7eb', color: '#4b5563' }}>
                      Score = 0.50 × Preference Match + 0.20 × Rating Score + 0.15 × Hidden Gem Score + 0.15 × Regional Match
                    </code>
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4A843' }} />
                      Stage 2 Formulation (Spatial Proximity)
                    </div>
                    <code style={{ display: 'block', padding: '10px', background: '#ffffff', borderRadius: '6px', fontSize: '11px', border: '0.5px solid #e5e7eb', color: '#4b5563' }}>
                      Score = 0.40 × Distance Score + 0.30 × Preference Match + 0.20 × Rating Score + 0.10 × Hidden Gem Score
                    </code>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '24px',
                border: '0.5px solid #e5e7eb',
                borderRadius: '12px',
                background: '#ffffff'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                  Verified Location Index
                </h3>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
                  Our database is local and compiled using verified landmarks and culinary spots in Kigali (such as Meza Malonga, Kurry Kingdom, Kurry Kingdom Indian Restaurant, Sole Luna, Kōzo, Fusion and Heaven). By executing the Python model builder end-to-end, similarities are matched directly to real coordinates using the mathematical Haversine formulations.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '0.5px solid #e5e7eb', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                Inzira Recommender Platform · v1.2.0 · Kigali Culinary & Travel Index
              </p>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
           Authentication Modal (Google & Email Login/Sign Up)
           ────────────────────────────────────────────────── */}
        {showAuthModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }} onClick={() => setShowAuthModal(false)}>
            <div className="auth-modal-content" style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative',
            }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAuthModal(false)} style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '18px',
                color: '#9ca3af',
                cursor: 'pointer',
              }}>✕</button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#1D9E75', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', marginBottom: '12px' }}>
                  I
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  Welcome to Inzira
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Sign in to save your preferences and favorite spots across Rwanda
                </p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                  {authError}
                </div>
              )}

               {/* Tabs for Login / Sign Up */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: authMode === 'login' ? '#1D9E75' : '#6b7280',
                    borderWidth: '0 0 2px 0',
                    borderStyle: 'solid',
                    borderColor: authMode === 'login' ? '#1D9E75' : 'transparent',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: authMode === 'signup' ? '#1D9E75' : '#6b7280',
                    borderWidth: '0 0 2px 0',
                    borderStyle: 'solid',
                    borderColor: authMode === 'signup' ? '#1D9E75' : 'transparent',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Email / Phone Form */}
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                {authMode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Elissa Twizeyimana"
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      required
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        color: '#1f2937',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Email or Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. name@example.com or +250..."
                    value={authIdentifier}
                    onChange={e => setAuthIdentifier(e.target.value)}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#1f2937',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPass}
                    onChange={e => setAuthPass(e.target.value)}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#1f2937',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#1D9E75',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(29, 158, 117, 0.15)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0F6E56'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1D9E75'}
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#9ca3af', fontSize: '12px' }}>
                <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
                <span>or continue with</span>
                <div style={{ flex: 1, height: '0.5px', background: '#e5e7eb' }} />
              </div>

              {/* Single Clean Firebase Google Sign-In Button */}
              <button id="btn-google-auth" onClick={handleGoogleLogin} disabled={authLoading} style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                {authLoading ? 'Signing in with Google...' : 'Continue with Google'}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
           Clean & Elegant User Profile Modal
           ────────────────────────────────────────────────── */}
        {showProfileModal && user && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }} onClick={() => setShowProfileModal(false)}>
            <div className="profile-modal-content" style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              animation: 'fadeInUp 0.25s ease-out',
            }} onClick={e => e.stopPropagation()}>
              
              {/* Close Button */}
              <button onClick={() => setShowProfileModal(false)} style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '18px',
                color: '#94a3b8',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
              }}>✕</button>

              {/* Profile Card Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid #1D9E75',
                      objectFit: 'cover',
                      boxShadow: '0 8px 16px -4px rgba(0,0,0,0.12)',
                    }}
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {user.name}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 12px 0' }}>
                  {user.email}
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: '#E1F5EE',
                  color: '#0F6E56',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                  Google Authenticated Account
                </div>
              </div>

              {/* Account Quick Details */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>❤️</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {user.savedPlaces?.length || 0} Bookmarks
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Saved travel spots</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowSavedModal(true);
                  }}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1D9E75',
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  View All
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #FCA5A5',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                Sign Out of Account
              </button>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
           Saved Places Drawer / Modal
           ────────────────────────────────────────────────── */}
        {showSavedModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }} onClick={() => setShowSavedModal(false)}>
            <div className="saved-modal-content" style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>My Saved Places</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{user?.savedPlaces?.length || 0} bookmarked places</p>
                </div>
                <button onClick={() => setShowSavedModal(false)} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!user?.savedPlaces || user.savedPlaces.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>❤️</div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>No saved places yet</p>
                    <p style={{ fontSize: '12px', maxWidth: '280px', margin: '4px auto 0' }}>Click the heart icon on any place card to bookmark it to your account.</p>
                  </div>
                ) : (
                  user.savedPlaces.map((place, idx) => (
                    <div key={idx} onClick={() => { setSelPlace(place); setStage('nearby'); setShowSavedModal(false); }} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      cursor: 'pointer',
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{place.place_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{place.category} · {place.district}</div>
                      </div>
                      <button onClick={(e) => toggleBookmark(place, e)} style={{ fontSize: '16px', cursor: 'pointer' }}>
                        ❤️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────
           Privacy Policy and User Terms Modal
           ────────────────────────────────────────────────── */}
        {showPrivacyModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }} onClick={() => setShowPrivacyModal(false)}>
            <div className="saved-modal-content" style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Privacy Policy & User Terms</h2>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Inzira Academic Prototype Document</p>
                </div>
                <button onClick={() => setShowPrivacyModal(false)} style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
              </div>

              <div className="no-scrollbar" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>1. About Inzira</h3>
                  <p>Inzira is an academic prototype developed for a capstone project. It helps users discover places in Rwanda based on interests, budget, time, location, and nearby options. Inzira is not an official tourism authority, booking platform, transport service, or emergency service.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>2. Data We Collect</h3>
                  <p>Inzira may use limited information such as user preferences, saved places, feedback ratings, optional comments, and basic account information if a user signs in. This information is used only to generate recommendations, improve the prototype, and support academic evaluation.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>3. Data We Do Not Collect</h3>
                  <p>Inzira does not require sensitive personal information such as national ID numbers, payment details, health information, exact home addresses, private documents, or private communications. Users should not submit sensitive personal information in feedback fields.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>4. How Recommendations Work</h3>
                  <p>Recommendations are generated using user preferences, place features, ratings, tags, and location-based scoring. Nearby recommendations are based on distance and relevance around a selected destination.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>5. Recommendation Limitations</h3>
                  <p>Inzira provides suggestions, not guarantees. Place information such as prices, opening hours, safety, accessibility, transport, and official requirements may change. Users should verify important travel details from official or trusted sources before visiting a place.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>6. User Control</h3>
                  <p>Users can choose their preferences, decide whether to save places, and choose whether to give feedback. Users may stop using the prototype at any time.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>7. Responsible Use</h3>
                  <p>Users should use Inzira respectfully and should not submit false, harmful, offensive, or sensitive information through feedback or comments.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>8. Academic Use</h3>
                  <p>Data collected through the prototype may be used in summary form for academic reporting and system improvement. The project aims to protect user privacy and avoid unnecessary data collection.</p>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>9. Contact</h3>
                  <p>For questions about this project, users may contact the project developer through the official project or academic communication channel.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ──────────────────────────────────────────────────
         Rich Professional Footer Component
         ────────────────────────────────────────────────── */}
      <footer style={{
        background: '#0F172A',
        color: '#f8fafc',
        padding: '64px 24px 32px',
        borderTop: '1px solid #1e293b',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}>
            {/* Column 1: Brand & Tagline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#1D9E75',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <SvgIcon name="discover" size={16} color="#ffffff" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Inzira</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Intelligent destination discovery platform for Rwanda. Uncover curated attractions, hidden gems, and tailored recommendations powered by machine learning.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Navigation
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
                <li><a onClick={() => { setSelPlace(null); setActiveNav('discover'); }} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Discover Spots</a></li>
                <li><a onClick={() => { setActiveNav('map'); }} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Interactive Map</a></li>
                <li><a onClick={() => { setShowSavedModal(true); }} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Saved Places ({user?.savedPlaces?.length || 0})</a></li>
                <li><a onClick={() => { setActiveNav('about'); }} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>About Project</a></li>
              </ul>
            </div>

            {/* Column 3: Featured Destinations */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Provinces & Cities
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
                <li>Kigali City</li>
                <li>Musanze & Volcanoes</li>
                <li>Rubavu & Lake Kivu</li>
                <li>Huye & Southern Heritage</li>
                <li>Karongi & Western Scenic Views</li>
              </ul>
            </div>

            {/* Column 4: Contact & Security */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Authentication & Security
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '12px' }}>
                Protected by Google Cloud Security & Firebase OAuth 2.0.
              </p>
            </div>
          </div>

          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#64748b',
          }}>
            <div>© 2026 Inzira Rwanda. Built with ❤️ for Capstone. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setShowPrivacyModal(true)}>Privacy Policy</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setShowPrivacyModal(true)}>Terms of Service</span>
              <span>•</span>
              <span>Firebase Identity</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ──────────────────────────────────────────────────
   Interactive Leaflet Map Canvas
   ────────────────────────────────────────────────── */
function CanvasMap({ selectedPlace, mainResults, nearbyResults }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Load Leaflet assets dynamically from CDN
  useEffect(() => {
    if (window.L) {
      setLoaded(true);
      return;
    }

    let cssLink = document.getElementById('leaflet-css');
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = 'leaflet-css';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    let jsScript = document.getElementById('leaflet-js');
    if (!jsScript) {
      jsScript = document.createElement('script');
      jsScript.id = 'leaflet-js';
      jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      jsScript.async = true;
      jsScript.onload = () => setLoaded(true);
      document.body.appendChild(jsScript);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Update map canvas instance
  useEffect(() => {
    if (!loaded || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const pts = [];
    if (selectedPlace) {
      pts.push({ ...selectedPlace, _type: 'selected' });
    }
    
    if (nearbyResults?.length) {
      nearbyResults.forEach(p => pts.push({ ...p, _type: 'nearby' }));
    } else if (mainResults?.length) {
      mainResults.forEach(p => pts.push({ ...p, _type: 'main' }));
    }

    const centerLa = pts.length ? pts[0].latitude : -1.9403;
    const centerLo = pts.length ? pts[0].longitude : 29.8739;
    const initialZoom = selectedPlace ? 14 : 9;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLa, centerLo], initialZoom);

    mapInstanceRef.current = map;

    // Use beautiful light voyager tile layer matching the flat design
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18
    }).addTo(map);

    const markers = [];

    pts.forEach(p => {
      const lat = parseFloat(p.latitude);
      const lon = parseFloat(p.longitude);
      if (isNaN(lat) || isNaN(lon)) return;

      let color = '#1D9E75';
      let pulseClass = '';
      let markerSize = 12;

      if (p._type === 'selected') {
        color = '#0F6E56';
        pulseClass = 'marker-pulse-selected';
        markerSize = 14;
      } else if (p._type === 'nearby') {
        color = '#D4A843';
        pulseClass = 'marker-pulse-nearby';
        markerSize = 10;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            background-color: ${color};
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            position: relative;
          ">
            <div class="${pulseClass}" style="
              position: absolute;
              top: -5px; left: -5px; right: -5px; bottom: -5px;
              border-radius: 50%;
              border: 1.5px solid ${color};
              opacity: 0;
              animation: marker-pulse-anim 2s infinite ease-out;
            "></div>
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
      });

      const popupContent = `
        <div style="
          background: #ffffff;
          color: #1f2937;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 12px;
        ">
          <div style="font-weight: 700; color: #111827; margin-bottom: 2px;">${p.place_name}</div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">${p.category} · ${p.district}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span style="color: #1D9E75; font-weight: 700;">${p.match_pct}% compatibility</span>
            ${p.distance_km ? `<span style="color: #6b7280; font-weight: 600;">${p.distance_km} km</span>` : ''}
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: customIcon })
        .bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-flat-popup',
          minWidth: 160,
          maxWidth: 240,
          autoPanPadding: [40, 40]
        })
        .addTo(map);

      if (p._type === 'selected') {
        marker.openPopup();
      }

      markers.push(marker);
    });

    if (pts.length > 1) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.12));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loaded, selectedPlace, mainResults, nearbyResults]);

  return (
    <div style={{ position: 'relative', height: selectedPlace ? '260px' : '400px', width: '100%', background: '#f3f4f6' }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, background: '#f9fafb', zIndex: 10
        }}>
          <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Loading Map Engine…</span>
        </div>
      )}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      <style>{`
        @keyframes marker-pulse-anim {
          0% { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        
        /* Premium custom Leaflet popup styling (Light Theme Flat) */
        .custom-flat-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          color: #1f2937 !important;
          border: 0.5px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .custom-flat-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: inherit !important;
          width: auto !important;
        }
        .custom-flat-popup .leaflet-popup-tip {
          background: #ffffff !important;
          border: 0.5px solid #e5e7eb !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
