# 101 Erste Lebensmittel – Baby-Tracker

React + Vite App mit Supabase Backend. Multi-User, multi-Baby, geräteübergreifend synchronisiert.

## Setup

### 1. Supabase Projekt anlegen
1. [supabase.com](https://supabase.com) → "New project"
2. Dashboard → SQL Editor → Inhalt von `supabase_schema.sql` einfügen → Run
3. Settings → API → `Project URL` und `anon public key` kopieren

### 2. Umgebungsvariablen
Datei `.env.local` anlegen (für lokale Entwicklung):
```
VITE_SUPABASE_URL=https://deine-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

### 3. Lokal starten
```bash
npm install
npm run dev
```

### 4. Vercel Deployment
1. GitHub Repo anlegen, Code pushen
2. vercel.com → "Add New Project" → GitHub Repo importieren
3. Environment Variables in Vercel setzen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Features
- Email/Passwort Auth (Supabase Auth)
- Mehrere Babies pro Account
- Lebensmittel mit Phasen-Empfehlungen (ab 6/8/10/12 Mo)
- Zubereitungshinweise und Sicherheitshinweise bei jedem Lebensmittel
- Allergen-Kennzeichnung
- Datum + Notizen/Reaktionen pro Lebensmittel
- Echtzeit-Sync across Geräte
- Row Level Security – jeder Nutzer sieht nur seine eigenen Daten
