import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'Data', 'inzira.db');

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open Database Connection
const db = new sqlite3.Database(DB_PATH);

// Helper to run query with Promise
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper to get single row
export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to get all rows
export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables
export async function initDb() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      identifier TEXT PRIMARY KEY,
      email TEXT,
      phone TEXT,
      name TEXT,
      avatar TEXT,
      password TEXT,
      provider TEXT,
      saved_preferences TEXT,
      created_at TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS saved_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_identifier TEXT,
      place_name TEXT,
      category TEXT,
      district TEXT,
      province_or_city TEXT,
      latitude REAL,
      longitude REAL,
      cost_level_norm TEXT,
      duration_norm TEXT,
      popularity_norm TEXT,
      hidden_gem_score_norm REAL,
      saved_at TEXT,
      FOREIGN KEY(user_identifier) REFERENCES users(identifier) ON DELETE CASCADE
    )
  `);
}

// Automatically migrate JSON data to SQLite
export async function migrateJsonToSqlite() {
  const jsonPath = path.join(process.cwd(), 'Data', 'user_profiles.json');
  if (!fs.existsSync(jsonPath)) return;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const profiles = JSON.parse(raw);
    console.log(`Migrating ${Object.keys(profiles).length} profiles from JSON to SQLite...`);

    // Ensure database tables exist
    await initDb();

    for (const [key, user] of Object.entries(profiles)) {
      const activeId = user.identifier || user.email || key;
      
      // Insert user
      await runQuery(`
        INSERT OR IGNORE INTO users (identifier, email, phone, name, avatar, password, provider, saved_preferences, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        activeId,
        user.email || null,
        user.phone || null,
        user.name || null,
        user.avatar || null,
        user.password || null,
        user.provider || 'email',
        JSON.stringify(user.savedPreferences || {}),
        user.createdAt || new Date().toISOString()
      ]);

      // Insert saved places
      if (user.savedPlaces && Array.isArray(user.savedPlaces)) {
        for (const place of user.savedPlaces) {
          // Check if place is already saved
          const exists = await getQuery(`
            SELECT id FROM saved_places WHERE user_identifier = ? AND place_name = ?
          `, [activeId, place.place_name]);
          
          if (!exists) {
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
              place.savedAt || place.saved_at || new Date().toISOString()
            ]);
          }
        }
      }
    }

    // Rename file to prevent repeating migration
    fs.renameSync(jsonPath, path.join(process.cwd(), 'Data', 'user_profiles.json.backup'));
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration to SQLite failed:", err);
  }
}
