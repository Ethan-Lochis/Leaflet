# 📍 Guide & Explication du Projet : Next.js + Leaflet + API Adresse Gouv

Ce projet est une application complète et légère permettant à un utilisateur de saisir une adresse en France, d'obtenir ses coordonnées GPS (latitude et longitude) via l'API officielle du gouvernement français, de les sauvegarder dans une base de données locale SQLite, puis d'afficher les lieux sous forme de marqueurs interactifs sur une carte OpenStreetMap avec **Leaflet**.

---

## 🏗️ 1. Architecture globale du projet

Le projet utilise **Next.js (App Router)** avec **TypeScript** et **Tailwind CSS**.

```text
leaflet/
├── data/
│   └── places.db               # Base de données SQLite locale créée automatiquement
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── places/
│   │   │       └── route.ts    # Route API Next.js (GET, POST, DELETE)
│   │   ├── globals.css         # Styles globaux + styles Leaflet
│   │   ├── layout.tsx          # Structure HTML principale
│   │   └── page.tsx            # Page d'accueil orchestrant les composants
│   ├── components/
│   │   ├── AddressForm.tsx     # Formulaire de saisie & autocomplétion
│   │   ├── PlacesList.tsx      # Liste des lieux enregistrés avec suppression
│   │   ├── Map.tsx             # Wrapper dynamique Leaflet (sans SSR)
│   │   └── MapLeaflet.tsx      # Composant Leaflet interactif (marqueurs, popups)
│   └── lib/
│       └── db.ts               # Connexion SQLite (better-sqlite3) & fonctions CRUD
├── package.json
└── EXPLICATION.md              # Cette documentation
```

---

## ⚙️ 2. Étape par étape : Comment fonctionne le code ?

### Étape 1 : Saisie de l'adresse & autocomplétion (`AddressForm.tsx`)

1. L'utilisateur a un champ où il peut taper une adresse (ex: *"Tour Eiffel, Paris"* ou *"10 Rue de la Paix"*).
2. Pour offrir une excellente expérience utilisateur, dès que l'utilisateur tape plus de 2 caractères, un appel `fetch` est envoyé avec un léger délai (*debounce* de 300 ms) vers :
   ```text
   https://api-adresse.data.gouv.fr/search/?q={recherche}&limit=5
   ```
3. Une liste déroulante affiche les adresses trouvées avec leur code postal et ville.
4. L'utilisateur peut soit :
   - Cliquer sur une proposition pour la sélectionner directement.
   - Ou valider directement son texte : le serveur effectuera alors lui-même la recherche.

---

### Étape 2 : Appel à l'API gouvernementale & Sauvegarde (`/api/places/route.ts` & `db.ts`)

#### ⚠️ Le piège classique des coordonnées (GeoJSON vs Leaflet) :
L'API `api-adresse.data.gouv.fr` renvoie un objet **GeoJSON**. Dans la spécification GeoJSON :
- `geometry.coordinates[0]` = **LONGITUDE** (axe X)
- `geometry.coordinates[1]` = **LATITUDE** (axe Y)

Or Leaflet attend l'ordre inverse : `[latitude, longitude]`.  
Dans notre route API, nous inversons donc proprement les variables :
```typescript
const [lon, lat] = feature.geometry.coordinates;
const latitude = lat;
const longitude = lon;
```

#### Sauvegarde en base de données SQLite :
Le module `src/lib/db.ts` utilise `better-sqlite3` pour créer automatiquement une base locale dans `data/places.db` sans configuration lourde :

```sql
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city TEXT,
  postcode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Les requêtes sont préparées (`db.prepare(...)`) pour être rapides et sécurisées contre les injections SQL.

---

### Étape 3 : Affichage sur la carte Leaflet (`Map.tsx` & `MapLeaflet.tsx`)

Afficher Leaflet dans Next.js comporte deux pièges réputés que nous avons résolus :

#### 1. L'erreur `window is not defined` (SSR Next.js)
Leaflet a impérativement besoin de l'objet `window` du navigateur. Comme Next.js pré-génère les pages côté serveur (SSR), un import direct de Leaflet provoquerait un crash.

**Solution :**
Dans `src/components/Map.tsx`, nous importons `MapLeaflet` dynamiquement avec l'option `ssr: false` :
```typescript
const MapLeaflet = dynamic(() => import("./MapLeaflet"), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
});
```

#### 2. L'icône de marqueur cassée (images 404)
Par défaut, Leaflet cherche des images PNG locales (`marker-icon.png`). Dans les bundlers modernes comme Webpack ou Turbopack, ces chemins sont souvent brisés.

**Solution :**
Nous utilisons `L.divIcon` pour générer un marqueur SVG stylisé en CSS directement. Il s'affiche instantanément, est net sur tous les écrans, et ne dépend d'aucun fichier image externe.

#### 3. Fonctionnalités de la carte :
- **Centrage automatique (`fitBounds`)** : Si plusieurs lieux sont enregistrés, la carte ajuste automatiquement son zoom pour que tous les points soient visibles.
- **Navigation fluide (`flyTo`)** : En cliquant sur un lieu dans la liste à gauche, la carte se déplace en douceur vers le marqueur et ouvre automatiquement sa bulle d'informations (*popup*).

---

## 🚀 3. Lancer le projet en local

Dans votre terminal :

```bash
# 1. Lancer le serveur de développement
pnpm dev
# (ou npm run dev si vous utilisez npm)
```

Ouvrez ensuite votre navigateur sur **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 4. Exemples de tests à faire

1. **Test 1 : Adresse emblématique**
   - Nom : `Tour Eiffel`
   - Adresse : `Champ de Mars, 5 Av. Anatole France, 75007 Paris`
   - Résultat : Le point apparaît à Paris, la base SQLite est mise à jour.

2. **Test 2 : Adresse en région**
   - Nom : `Place Bellecour`
   - Adresse : `Place Bellecour, Lyon`
   - Résultat : La carte fait automatiquement un dézoom pour afficher Paris et Lyon en même temps.

3. **Test 3 : Interaction**
   - Cliquez sur un lieu dans la liste de gauche : la carte effectue une animation (*flyTo*) vers le point et ouvre la popup avec l'adresse exacte et les coordonnées GPS.
   - Cliquez sur l'icône de corbeille pour supprimer le point de la base SQLite et de la carte.
