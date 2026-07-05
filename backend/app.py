"""
app.py — Inzira
Streamlit web app: Personalized Rwanda tourism recommendation system.
Dark flat UI matching the design spec.
"""

import os
import sys

# Allow imports from app/ folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st
import pandas as pd
import pydeck as pdk

from data_loader import (
    load_rwanda_data,
    get_place_names,
    get_provinces,
    save_feedback,
)
from recommender import (
    recommend_main_places,
    recommend_nearby_places,
    generate_reason,
    get_category_emoji,
    get_category_color,
)

# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="Inzira — Rwanda Place Recommendations",
    page_icon="🌿",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ============================================================
# GLOBAL CSS — Dark Flat Design
# ============================================================

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ---- Reset & base ---- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, [data-testid="stAppViewContainer"] {
    background: #131313 !important;
    font-family: 'Inter', sans-serif !important;
    color: #E8E8E8 !important;
}

[data-testid="stAppViewContainer"] > .main { background: #131313 !important; }
[data-testid="stHeader"] { background: transparent !important; }
[data-testid="stToolbar"] { display: none !important; }
.block-container { padding: 0 !important; max-width: 480px !important; margin: 0 auto !important; }
footer { display: none !important; }

/* ---- Scrollbar ---- */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 2px; }

/* ---- Top hero bar ---- */
.inzira-header {
    text-align: center;
    padding: 36px 24px 18px;
    border-bottom: 0.5px solid #2a2a2a;
}
.inzira-header h1 {
    font-size: 28px;
    font-weight: 600;
    color: #F0F0F0;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
}
.inzira-header p {
    font-size: 13px;
    font-weight: 400;
    color: #888;
    letter-spacing: 0.1px;
}

/* ---- Preference bar ---- */
.pref-bar {
    margin: 16px 16px 0;
    padding: 12px 16px;
    background: #1E1E1E;
    border: 0.5px solid #2e2e2e;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.pref-bar-label {
    font-size: 12px;
    color: #666;
    font-weight: 500;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
}
.chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    border: 0.5px solid #2e2e2e;
    background: #252525;
    color: #bbb;
    white-space: nowrap;
}
.chip.active {
    background: #1D3D35;
    border-color: #1D9E75;
    color: #1D9E75;
}

/* ---- Section labels ---- */
.section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #666;
    padding: 20px 16px 10px;
}

/* ---- Survey stats strip ---- */
.stats-strip {
    margin: 0 16px 4px;
    padding: 14px 16px;
    background: #1A2D28;
    border: 0.5px solid #1D9E75;
    border-radius: 12px;
}
.stats-strip .stat-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
}
.stats-strip .stat-row:last-child { margin-bottom: 0; }
.stats-strip .stat-num {
    font-size: 18px;
    font-weight: 700;
    color: #1D9E75;
}
.stats-strip .stat-txt {
    font-size: 11px;
    color: #aaa;
    line-height: 1.4;
}

/* ---- TOP PICKS CARD GRID ---- */
.cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    padding: 0 16px;
}
.place-card {
    background: #1E1E1E;
    border: 0.5px solid #2a2a2a;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.1s ease;
    position: relative;
}
.place-card:hover {
    border-color: #1D9E75;
    transform: translateY(-1px);
}
.place-card.selected {
    border-color: #1D9E75;
    box-shadow: 0 0 0 1px #1D9E75;
}
.card-icon-area {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}
.card-icon-area.teal   { background: #1A3330; }
.card-icon-area.amber  { background: #2E2510; }
.card-icon-area.purple { background: #24213A; }
.card-body { padding: 10px 9px 10px; }
.card-category {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.card-name {
    font-size: 12px;
    font-weight: 600;
    color: #E8E8E8;
    line-height: 1.3;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.card-rating {
    font-size: 10px;
    color: #888;
    display: flex;
    align-items: center;
    gap: 2px;
}
.card-match {
    font-size: 10px;
    font-weight: 600;
    color: #1D9E75;
}
.best-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #1D9E75;
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 3px 7px;
    border-radius: 20px;
}

/* ---- NEARBY LIST ---- */
.nearby-list { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
.nearby-row {
    background: #1E1E1E;
    border: 0.5px solid #2a2a2a;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.15s ease;
}
.nearby-row:hover { border-color: #1D9E75; }
.nearby-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}
.nearby-icon.teal   { background: #1A3330; }
.nearby-icon.amber  { background: #2E2510; }
.nearby-icon.purple { background: #24213A; }
.nearby-middle { flex: 1; min-width: 0; }
.nearby-name {
    font-size: 13px;
    font-weight: 600;
    color: #E8E8E8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nearby-sub {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nearby-right { text-align: right; flex-shrink: 0; }
.nearby-dist { font-size: 11px; color: #888; margin-bottom: 2px; }
.nearby-match { font-size: 12px; font-weight: 600; color: #1D9E75; }

/* ---- BOTTOM NAV ---- */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: #1A1A1A;
    border-top: 0.5px solid #2a2a2a;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 0 14px;
    z-index: 100;
}
.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    opacity: 0.5;
}
.nav-item.active { opacity: 1; }
.nav-item svg { width: 22px; height: 22px; }
.nav-item.active svg path, .nav-item.active svg rect,
.nav-item.active svg circle, .nav-item.active svg polyline,
.nav-item.active svg line { stroke: #1D9E75 !important; }
.nav-label {
    font-size: 10px;
    font-weight: 500;
    color: #888;
}
.nav-item.active .nav-label { color: #1D9E75; }

/* ---- GET RECS BUTTON ---- */
div[data-testid="stButton"] > button {
    background: #1D9E75 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 10px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    padding: 10px 0 !important;
    width: 100% !important;
    transition: background 0.15s ease !important;
}
div[data-testid="stButton"] > button:hover {
    background: #178A64 !important;
}

/* ---- Streamlit widget overrides ---- */
[data-testid="stMultiSelect"] > div,
[data-testid="stSelectbox"] > div > div {
    background: #1E1E1E !important;
    border: 0.5px solid #2e2e2e !important;
    border-radius: 10px !important;
    color: #E8E8E8 !important;
}
[data-testid="stSlider"] { padding: 0 !important; }
label { color: #888 !important; font-size: 12px !important; }
.stMultiSelect span[data-baseweb="tag"] {
    background: #1D3D35 !important;
    color: #1D9E75 !important;
}
[data-testid="stExpander"] {
    background: #1E1E1E !important;
    border: 0.5px solid #2e2e2e !important;
    border-radius: 12px !important;
}
.stTextArea textarea, .stTextInput input {
    background: #1E1E1E !important;
    border: 0.5px solid #2e2e2e !important;
    color: #E8E8E8 !important;
    border-radius: 10px !important;
}
[data-testid="stSelectbox"] svg { fill: #666 !important; }
[data-testid="stRadio"] label { color: #aaa !important; font-size: 13px !important; }
[data-testid="stRadio"] [data-testid="stWidgetLabel"] { color: #888 !important; }
div.stAlert { border-radius: 10px !important; }
[data-testid="stForm"] { background: transparent !important; border: none !important; }

/* ---- Map container ---- */
.map-container { padding: 0 16px; border-radius: 14px; overflow: hidden; }
iframe { border-radius: 14px !important; }

/* ---- Spacer for bottom nav ---- */
.bottom-spacer { height: 80px; }

/* ---- Feedback section ---- */
.feedback-section {
    margin: 0 16px;
    padding: 16px;
    background: #1E1E1E;
    border: 0.5px solid #2a2a2a;
    border-radius: 14px;
}
.feedback-section h3 {
    font-size: 13px;
    font-weight: 600;
    color: #E8E8E8;
    margin-bottom: 12px;
}

/* ---- Empty state ---- */
.empty-state {
    text-align: center;
    padding: 40px 24px;
    color: #555;
}
.empty-state .empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-state p { font-size: 13px; line-height: 1.6; }

/* ---- Reason text ---- */
.reason-text {
    font-size: 10px;
    color: #555;
    margin-top: 4px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ---- Tab overrides ---- */
[data-testid="stTabs"] [data-testid="stTab"] {
    background: transparent !important;
    color: #666 !important;
    font-size: 13px !important;
    border-bottom: 2px solid transparent !important;
}
[data-testid="stTabs"] [data-testid="stTab"][aria-selected="true"] {
    color: #1D9E75 !important;
    border-bottom-color: #1D9E75 !important;
}
[data-testid="stTabPanel"] { padding: 0 !important; }
</style>
""", unsafe_allow_html=True)


# ============================================================
# LOAD DATA
# ============================================================

@st.cache_data(show_spinner=False)
def get_data():
    return load_rwanda_data()

try:
    df = get_data()
except Exception as e:
    st.error(f"⚠️ Could not load Rwanda dataset: {e}")
    st.stop()

place_names = get_place_names(df)
provinces = ["Any"] + get_provinces(df)

INTEREST_OPTIONS = [
    ("🌿", "nature"),
    ("🦁", "wildlife"),
    ("🏛️", "culture"),
    ("🍽️", "food"),
    ("📜", "history"),
    ("🏔️", "adventure"),
    ("🎨", "art"),
    ("🛍️", "shopping"),
    ("😌", "relaxation"),
    ("☕", "coffee"),
    ("🏨", "lodging"),
]

# ============================================================
# SESSION STATE
# ============================================================

if "stage" not in st.session_state:
    st.session_state.stage = "preferences"  # preferences | results | nearby
if "main_results" not in st.session_state:
    st.session_state.main_results = None
if "nearby_results" not in st.session_state:
    st.session_state.nearby_results = None
if "selected_place_row" not in st.session_state:
    st.session_state.selected_place_row = None
if "user_prefs" not in st.session_state:
    st.session_state.user_prefs = {}
if "active_tab" not in st.session_state:
    st.session_state.active_tab = "home"
if "selected_interests" not in st.session_state:
    st.session_state.selected_interests = []

# ============================================================
# HEADER
# ============================================================

st.markdown("""
<div class="inzira-header">
    <h1>Inzira</h1>
    <p>Discover the best places Rwanda has to offer</p>
</div>
""", unsafe_allow_html=True)

# ============================================================
# TAB NAVIGATION (simulated via buttons)
# ============================================================

tab_home, tab_map, tab_about = st.tabs(["🏠 Home", "🗺️ Map", "📊 About"])

# ============================================================
# HOME TAB
# ============================================================

with tab_home:

    # ---- Survey stats strip ----
    st.markdown('<div class="section-label">PROBLEM EVIDENCE</div>', unsafe_allow_html=True)
    st.markdown("""
    <div class="stats-strip">
        <div class="stat-row">
            <span class="stat-num">85.6%</span>
            <span class="stat-txt">struggle or sometimes struggle to find places matching their interests, budget & location</span>
        </div>
        <div class="stat-row">
            <span class="stat-num">95.0%</span>
            <span class="stat-txt">say nearby, affordable or hidden-place suggestions would be useful</span>
        </div>
        <div class="stat-row">
            <span class="stat-num">5,129</span>
            <span class="stat-txt">survey responses &nbsp;·&nbsp; Only 25.8% find current platforms truly personalized</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ---- Preference section ----
    st.markdown('<div class="section-label">YOUR PREFERENCES</div>', unsafe_allow_html=True)

    with st.container():
        with st.expander("⚙️  Set your preferences", expanded=True):

            # Interests (multi-select as chips)
            st.markdown("**Interests**")
            cols = st.columns(4)
            selected_interests = []
            for i, (emoji, tag) in enumerate(INTEREST_OPTIONS):
                col = cols[i % 4]
                with col:
                    key = f"interest_{tag}"
                    checked = st.checkbox(f"{emoji} {tag.capitalize()}", key=key, value=(tag in st.session_state.selected_interests))
                    if checked:
                        selected_interests.append(tag)
            st.session_state.selected_interests = selected_interests

            col1, col2 = st.columns(2)
            with col1:
                budget = st.selectbox(
                    "Budget",
                    ["any", "low", "medium", "high"],
                    format_func=lambda x: {"any": "💰 Any", "low": "💚 Budget", "medium": "🟡 Moderate", "high": "🔴 Splurge"}[x],
                    key="budget_sel"
                )
            with col2:
                available_time = st.selectbox(
                    "Available Time",
                    ["any", "1-2 hours", "half-day", "full-day", "weekend"],
                    format_func=lambda x: {"any": "⏱ Any", "1-2 hours": "1–2 hrs", "half-day": "Half day", "full-day": "Full day", "weekend": "Weekend"}[x],
                    key="time_sel"
                )

            col3, col4 = st.columns(2)
            with col3:
                preferred_province = st.selectbox(
                    "Preferred Region",
                    provinces,
                    key="province_sel"
                )
            with col4:
                hidden_gem_pref = st.selectbox(
                    "Place Type",
                    ["both", "popular places", "hidden gems"],
                    format_func=lambda x: {"both": "🔀 Both", "popular places": "⭐ Popular", "hidden gems": "💎 Hidden gems"}[x],
                    key="hgpref_sel"
                )

            top_n = st.slider("Number of recommendations", 3, 10, 5, key="topn_sel")

            btn_clicked = st.button("🔍  Get Recommendations", use_container_width=True, key="get_recs_btn")

    if btn_clicked:
        if not selected_interests:
            st.warning("Please select at least one interest to get personalized recommendations.")
        else:
            user_prefs = {
                "interests": selected_interests,
                "budget": budget,
                "available_time": available_time,
                "preferred_province": preferred_province if preferred_province != "Any" else "any",
                "hidden_gem_pref": hidden_gem_pref,
            }
            st.session_state.user_prefs = user_prefs
            with st.spinner("Finding your best matches across Rwanda..."):
                results = recommend_main_places(user_prefs, df, top_n=top_n)
            st.session_state.main_results = results
            st.session_state.nearby_results = None
            st.session_state.selected_place_row = None
            st.session_state.stage = "results"
            st.rerun()

    # ---- Preference chips display ----
    if st.session_state.selected_interests:
        chips_html = '<div class="pref-bar"><span class="pref-bar-label">⚙️ Active:</span>'
        for interest in st.session_state.selected_interests:
            emoji = next((e for e, t in INTEREST_OPTIONS if t == interest), "")
            chips_html += f'<span class="chip active">{emoji} {interest.capitalize()}</span>'
        chips_html += '</div>'
        st.markdown(chips_html, unsafe_allow_html=True)

    # ============================================================
    # STAGE 1 — TOP PICKS GRID
    # ============================================================

    if st.session_state.main_results is not None and len(st.session_state.main_results) > 0:
        results_df = st.session_state.main_results
        selected_row = st.session_state.selected_place_row

        st.markdown('<div class="section-label">TOP PICKS FOR YOU</div>', unsafe_allow_html=True)

        # Build card HTML
        cards_html = '<div class="cards-grid">'
        for i, (_, row) in enumerate(results_df.iterrows()):
            emoji = get_category_emoji(str(row.get("category", "")))
            color = get_category_color(str(row.get("category", "")))
            cat = str(row.get("category", "PLACE")).upper()[:20]
            name = str(row.get("place_name", "Unknown"))
            pop = str(row.get("popularity_norm", "medium")).capitalize()
            match = int(row.get("match_pct", 0))
            is_selected = (selected_row is not None and str(selected_row.get("place_name")) == name)
            selected_cls = "selected" if is_selected else ""

            badge = '<div class="best-badge">Best match</div>' if i == 0 else ""
            cards_html += f"""
            <div class="place-card {selected_cls}" id="card_{i}">
                {badge}
                <div class="card-icon-area {color}">{emoji}</div>
                <div class="card-body">
                    <div class="card-category">{cat}</div>
                    <div class="card-name">{name}</div>
                    <div class="card-meta">
                        <span class="card-rating">⭐ {pop}</span>
                        <span class="card-match">{match}%</span>
                    </div>
                </div>
            </div>
            """
        cards_html += '</div>'
        st.markdown(cards_html, unsafe_allow_html=True)

        # ---- Select a card (via selectbox below grid) ----
        st.markdown('<div style="height:10px"></div>', unsafe_allow_html=True)
        card_names = results_df["place_name"].tolist()
        default_idx = 0
        if selected_row is not None:
            try:
                default_idx = card_names.index(str(selected_row["place_name"]))
            except ValueError:
                default_idx = 0

        st.markdown("<div style='padding: 0 16px;'>", unsafe_allow_html=True)
        chosen = st.selectbox(
            "👆 Select a place to explore nearby",
            card_names,
            index=default_idx,
            key="chosen_place_sel"
        )
        explore_btn = st.button("📍  Show Nearby Places", use_container_width=True, key="explore_btn")
        st.markdown("</div>", unsafe_allow_html=True)

        if explore_btn and chosen:
            sel_row = df[df["place_name"] == chosen].iloc[0]
            st.session_state.selected_place_row = sel_row
            prefs = st.session_state.user_prefs
            with st.spinner(f"Finding places near {chosen}..."):
                nearby = recommend_nearby_places(sel_row, prefs, df, top_n=top_n)
            st.session_state.nearby_results = nearby
            st.session_state.stage = "nearby"
            st.rerun()

    elif st.session_state.stage == "preferences":
        # Empty state
        st.markdown("""
        <div class="empty-state">
            <div class="empty-icon">🌍</div>
            <p>Set your preferences above and tap<br><strong style="color:#1D9E75">Get Recommendations</strong><br>to discover places in Rwanda.</p>
        </div>
        """, unsafe_allow_html=True)

    # ============================================================
    # STAGE 2 — NEARBY TO EXPLORE
    # ============================================================

    if st.session_state.nearby_results is not None and st.session_state.selected_place_row is not None:
        nearby_df = st.session_state.nearby_results
        sel_name = str(st.session_state.selected_place_row["place_name"])

        st.markdown(f'<div class="section-label">NEARBY · {sel_name.upper()[:30]}</div>', unsafe_allow_html=True)

        if len(nearby_df) == 0:
            st.markdown("""
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No nearby places found matching your preferences.</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            nearby_html = '<div class="nearby-list">'
            for _, row in nearby_df.iterrows():
                emoji = get_category_emoji(str(row.get("category", "")))
                color = get_category_color(str(row.get("category", "")))
                name = str(row.get("place_name", "Unknown"))
                district = str(row.get("district", ""))
                cat = str(row.get("category", ""))
                sub = f"{cat} · {district}" if cat and district else cat or district
                dist_km = float(row.get("distance_km", 0))
                match = int(row.get("match_pct", 0))
                reason = generate_reason(
                    st.session_state.user_prefs,
                    row,
                    dist_km,
                    sel_name,
                )
                nearby_html += f"""
                <div class="nearby-row">
                    <div class="nearby-icon {color}">{emoji}</div>
                    <div class="nearby-middle">
                        <div class="nearby-name">{name}</div>
                        <div class="nearby-sub">{sub}</div>
                        <div class="reason-text">{reason}</div>
                    </div>
                    <div class="nearby-right">
                        <div class="nearby-dist">{dist_km:.1f} km away</div>
                        <div class="nearby-match">{match}% match</div>
                    </div>
                </div>
                """
            nearby_html += '</div>'
            st.markdown(nearby_html, unsafe_allow_html=True)

        # Reset button
        st.markdown('<div style="height:10px"></div>', unsafe_allow_html=True)
        st.markdown("<div style='padding: 0 16px;'>", unsafe_allow_html=True)
        if st.button("← Back to top picks", use_container_width=True, key="back_btn"):
            st.session_state.nearby_results = None
            st.session_state.selected_place_row = None
            st.session_state.stage = "results"
            st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    # ---- Feedback ----
    if st.session_state.main_results is not None:
        st.markdown('<div class="section-label">FEEDBACK</div>', unsafe_allow_html=True)
        st.markdown('<div class="feedback-section">', unsafe_allow_html=True)
        with st.form("feedback_form", clear_on_submit=True):
            st.markdown("<h3>Was this helpful?</h3>", unsafe_allow_html=True)
            col_a, col_b = st.columns(2)
            with col_a:
                useful = st.radio("Useful?", ["Yes", "No"], horizontal=True, key="fb_useful")
            with col_b:
                fb_rating = st.slider("Rating", 1, 5, 4, key="fb_rating")
            fb_comment = st.text_area("Any comments? (optional)", placeholder="What could be better?", key="fb_comment", height=70)
            submitted = st.form_submit_button("Submit Feedback", use_container_width=True)
            if submitted:
                top_place = ""
                if st.session_state.main_results is not None and len(st.session_state.main_results) > 0:
                    top_place = str(st.session_state.main_results.iloc[0]["place_name"])
                save_feedback(useful, fb_rating, fb_comment, top_place)
                st.success("✅ Thank you for your feedback!")
        st.markdown('</div>', unsafe_allow_html=True)

    # Bottom spacer for nav
    st.markdown('<div class="bottom-spacer"></div>', unsafe_allow_html=True)

# ============================================================
# MAP TAB
# ============================================================

with tab_map:
    st.markdown('<div class="section-label">MAP VIEW</div>', unsafe_allow_html=True)

    map_data = []

    if st.session_state.selected_place_row is not None:
        sel = st.session_state.selected_place_row
        map_data.append({
            "lat": float(sel["latitude"]),
            "lon": float(sel["longitude"]),
            "name": str(sel["place_name"]),
            "type": "selected",
            "color": [29, 158, 117, 220],
            "radius": 300,
        })

    if st.session_state.nearby_results is not None:
        for _, row in st.session_state.nearby_results.iterrows():
            map_data.append({
                "lat": float(row["latitude"]),
                "lon": float(row["longitude"]),
                "name": str(row["place_name"]),
                "type": "nearby",
                "color": [255, 200, 80, 180],
                "radius": 200,
            })
    elif st.session_state.main_results is not None:
        for _, row in st.session_state.main_results.iterrows():
            map_data.append({
                "lat": float(row["latitude"]),
                "lon": float(row["longitude"]),
                "name": str(row["place_name"]),
                "type": "main",
                "color": [29, 158, 117, 180],
                "radius": 200,
            })

    if map_data:
        map_df = pd.DataFrame(map_data)
        center_lat = map_df["lat"].mean()
        center_lon = map_df["lon"].mean()

        layer = pdk.Layer(
            "ScatterplotLayer",
            data=map_df,
            get_position=["lon", "lat"],
            get_fill_color="color",
            get_radius="radius",
            pickable=True,
        )
        view = pdk.ViewState(
            latitude=center_lat,
            longitude=center_lon,
            zoom=7,
            pitch=0,
        )
        tooltip = {"html": "<b>{name}</b>", "style": {"background": "#1E1E1E", "color": "#E8E8E8", "fontSize": "12px", "borderRadius": "8px"}}
        st.pydeck_chart(
            pdk.Deck(
                layers=[layer],
                initial_view_state=view,
                tooltip=tooltip,
                map_style="mapbox://styles/mapbox/dark-v10",
            ),
            use_container_width=True,
        )
        # Legend
        st.markdown("""
        <div style="padding: 10px 16px; font-size: 11px; color: #666;">
            <span style="color:#1D9E75">●</span> Selected / Recommended &nbsp;
            <span style="color:#FFC850">●</span> Nearby places
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="empty-state" style="padding:40px 24px;">
            <div class="empty-icon">🗺️</div>
            <p>Get recommendations first, then select a place to see it on the map.</p>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="bottom-spacer"></div>', unsafe_allow_html=True)

# ============================================================
# ABOUT TAB
# ============================================================

with tab_about:
    st.markdown('<div class="section-label">ABOUT INZIRA</div>', unsafe_allow_html=True)
    st.markdown("""
    <div style="padding: 0 16px;">
    <div style="background:#1E1E1E; border:0.5px solid #2a2a2a; border-radius:14px; padding:16px; margin-bottom:12px;">
        <p style="font-size:13px; color:#aaa; line-height:1.7;">
        <strong style="color:#E8E8E8;">Inzira</strong> is a machine learning-based personalized tourism
        and nearby place recommendation system for Rwanda.
        It uses a two-stage approach to first match places to your preferences,
        then find great spots near the place you choose.
        </p>
    </div>

    <div style="background:#1E1E1E; border:0.5px solid #2a2a2a; border-radius:14px; padding:16px; margin-bottom:12px;">
        <p style="font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#666; margin-bottom:10px;">HOW IT WORKS</p>
        <div style="font-size:12px; color:#aaa; line-height:1.8;">
            <div>🎯 <strong style="color:#E8E8E8;">Stage 1</strong> — Preference-based main recommendations</div>
            <div style="font-size:11px; color:#555; padding: 2px 0 8px 24px;">
                50% preference · 20% rating · 15% hidden gem · 15% location
            </div>
            <div>📍 <strong style="color:#E8E8E8;">Stage 2</strong> — Nearby exploration around your pick</div>
            <div style="font-size:11px; color:#555; padding: 2px 0 0 24px;">
                40% distance · 30% preference · 20% rating · 10% hidden gem
            </div>
        </div>
    </div>

    <div style="background:#1A2D28; border:0.5px solid #1D9E75; border-radius:14px; padding:16px; margin-bottom:12px;">
        <p style="font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#1D9E75; margin-bottom:10px;">DATASET</p>
        <div style="font-size:12px; color:#aaa; line-height:1.8;">
            <div>🌍 1,235 Rwanda places across 10 categories</div>
            <div>📊 TripAdvisor international dataset (training/testing)</div>
            <div>📌 Haversine distance calculation for nearby scoring</div>
        </div>
    </div>

    <div style="background:#1E1E1E; border:0.5px solid #2a2a2a; border-radius:14px; padding:16px;">
        <p style="font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#666; margin-bottom:10px;">CAPSTONE PROJECT</p>
        <p style="font-size:12px; color:#666; line-height:1.6;">
            Inzira: A Machine Learning-Based Personalized Tourism<br>
            and Nearby Place Recommendation System for Rwanda
        </p>
    </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="bottom-spacer"></div>', unsafe_allow_html=True)

# ============================================================
# BOTTOM NAV BAR
# ============================================================

st.markdown("""
<div class="bottom-nav">
    <div class="nav-item active">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nav-label" style="color:#1D9E75;">Home</span>
    </div>
    <div class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6V22L8 18L16 22L23 18V2L16 6L8 2L1 6Z" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 2V18" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 6V22" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nav-label">Map</span>
    </div>
    <div class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69365 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69365 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39464C21.7563 5.72717 21.351 5.12076 20.84 4.61Z" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nav-label">Saved</span>
    </div>
    <div class="nav-item">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nav-label">Profile</span>
    </div>
</div>
""", unsafe_allow_html=True)
