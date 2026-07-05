'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  recommendMainPlaces,
  recommendNearbyPlaces,
  generateReason,
  getCategoryColor,
} from '@/lib/recommender';

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
  { v: 'both', l: 'All Spots' },
  { v: 'popular places', l: 'Popular Favorites' },
  { v: 'hidden gems', l: 'Hidden Gems' }
];

/* ──────────────────────────────────────────────────
   Category Color Palette (Premium Flat Light Theme)
   ────────────────────────────────────────────────── */
function categoryColors(cat) {
  const c = getCategoryColor(cat);
  return {
    teal:   { bg: '#EBFDF7', accent: '#1D9E75', text: '#0F6E56' },
    amber:  { bg: '#FFF9EB', accent: '#D4A843', text: '#8C6512' },
    purple: { bg: '#F6F3FF', accent: '#8b7fd4', text: '#5145A0' },
  }[c] || { bg: '#EBFDF7', accent: '#1D9E75', text: '#0F6E56' };
}

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
  const [hgPref, setHgPref]         = useState('both');
  const [topN, setTopN]             = useState(6);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Results State
  const [stage, setStage]           = useState('results');
  const [mainResults, setMainResults]   = useState([]);
  const [nearbyResults, setNearbyResults] = useState([]);
  const [selPlace, setSelPlace]     = useState(null);

  // Layout navigation
  const [activeNav, setActiveNav]   = useState('discover');
  
  // Feedback System
  const [fbRating, setFbRating]     = useState(0);
  const [fbDone, setFbDone]         = useState(false);
  const [fbComment, setFbComment]   = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

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
  }, []);

  // Recalculate recommendations in real-time on query or preferences change
  useEffect(() => {
    if (places.length === 0) return;

    let filtered = places;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = places.filter(p => 
        p.place_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.tags_list && p.tags_list.some(t => t.toLowerCase().includes(q)))
      );
    }

    const userPrefs = {
      interests,
      budget,
      available_time: time,
      preferred_province: province,
      hidden_gem_pref: hgPref
    };

    const recs = recommendMainPlaces(userPrefs, filtered, topN);
    setMainResults(recs);

    if (selPlace) {
      const found = places.find(p => p.place_name === selPlace.place_name);
      if (found) {
        setNearbyResults(recommendNearbyPlaces(found, userPrefs, places, topN));
      } else {
        setSelPlace(null);
        setNearbyResults([]);
        setStage('results');
      }
    } else {
      setStage(recs.length > 0 ? 'results' : 'empty');
    }
  }, [places, interests, budget, time, province, hgPref, topN, searchQuery, selPlace]);

  // Click card to enter detailed view & load nearby spots (Stage 2)
  const handleCardClick = useCallback((place) => {
    setSelPlace(place);
    const userPrefs = { interests, budget, available_time: time, preferred_province: province, hidden_gem_pref: hgPref };
    setNearbyResults(recommendNearbyPlaces(place, userPrefs, places, topN));
    setStage('nearby');
    setFbRating(0);
    setFbDone(false);
    setFbComment('');
    
    // Smooth scroll back up to the detail section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [interests, budget, time, province, hgPref, topN, places]);

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
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '8px' }}>
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
        </div>
      </header>

      {/* ──────────────────────────────────────────────────
         Main Application Shell Layout
         ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        
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
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
                  
                  {/* Left Column: Place Details & Feedback */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Header info */}
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
                  <h1 style={{ fontSize: '42px', fontWeight: 500, letterSpacing: '-0.03em', color: '#111827', marginBottom: '10px' }}>
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

                  {/* Place Type / Hidden Gems Dropdown */}
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

                  {/* Show Results slider */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    border: '0.5px solid #d1d5db',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                  }}>
                    <span>Show: {topN}</span>
                    <input type="range" min={3} max={12} value={topN} onChange={e => setTopN(+e.target.value)} style={{
                      accentColor: '#1D9E75',
                      cursor: 'pointer',
                      width: '50px',
                      height: '3px',
                      border: 'none',
                      background: '#e5e7eb',
                    }} />
                  </div>
                </div>

                {/* 4. Top Picks Grid (3 Columns) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '0.5px solid #e5e7eb', paddingBottom: '10px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {searchQuery ? `Search Results (${mainResults.length})` : 'Recommended Picks'}
                    </h2>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      Sorted by ML compatibility
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
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '24px',
                    }}>
                      {mainResults.map((place, i) => {
                        const cs = categoryColors(place.category);
                        return (
                          <div
                            key={place.place_id || i}
                            id={`card-${i}`}
                            onClick={() => handleCardClick(place)}
                            style={{
                              background: '#ffffff',
                              border: '0.5px solid #e5e7eb',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                          >
                            {/* Card top cover box - category outline representation */}
                            <div style={{
                              height: '110px',
                              background: cs.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <SvgIcon name={categoryIconName(place.category)} size={28} color={cs.accent} />
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

      </main>
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
