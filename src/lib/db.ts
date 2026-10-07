import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Définition de l'interface d'un Lieu
export interface Place {
  id: number;
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postcode?: string;
  created_at: string;
}

// Emplacement de la base de données SQLite locale
const dbDirectory = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const dbPath = path.join(dbDirectory, "places.db");
const db = new Database(dbPath);

// Initialisation de la table si elle n'existe pas encore
db.exec(`
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    city TEXT,
    postcode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Récupérer tous les lieux
export function getPlaces(): Place[] {
  const stmt = db.prepare("SELECT * FROM places ORDER BY created_at DESC");
  return stmt.all() as Place[];
}

// Ajouter un lieu avec ses coordonnées
export function addPlace(data: {
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postcode?: string;
}): Place {
  const stmt = db.prepare(`
    INSERT INTO places (name, address, latitude, longitude, city, postcode)
    VALUES (@name, @address, @latitude, @longitude, @city, @postcode)
  `);

  const info = stmt.run({
    name: data.name || null,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city || null,
    postcode: data.postcode || null,
  });

  const getStmt = db.prepare("SELECT * FROM places WHERE id = ?");
  return getStmt.get(info.lastInsertRowid) as Place;
}

// Supprimer un lieu (utile pour les tests)
export function deletePlace(id: number): boolean {
  const stmt = db.prepare("DELETE FROM places WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
